import {
  CoordinatedPlan,
  PrintEstimateResult,
  FoodEstimateResult,
} from "../../types";
import { JsonRepository } from "../repository/db";
import { calculatePrintEstimate } from "./print-agent";
import { calculateFoodEstimate, findRecommendedVegMeal } from "./canteen-agent";
import { findNextClass } from "./student-day-agent";
import { evaluateSchedules } from "../scheduler/pure-scheduler";
import { parseIntentWithGemma } from "../gemma/client";

export interface OrchestratorInput {
  prompt: string;
  studentId?: string;
  currentLocationId?: string;
  forcedBudget?: number;
  forcedMinutes?: number;
  referenceTime?: string; // for deterministic test harnesses
  referenceDay?: any;
}

/**
 * Deterministic Natural Language Parser for Demo Mode.
 * Accurately extracts minutes, page counts, food preferences, and budgets.
 */
export function parsePromptDeterministic(prompt: string) {
  const lower = prompt.toLowerCase();

  // Extract minutes (e.g. "35 minutes", "20 min", "15m")
  const minMatch =
    lower.match(/(\d+)\s*(?:minutes|minute|mins|min)\b/) ||
    lower.match(/before my next class.*?(\d+)/);
  const minutes = minMatch ? parseInt(minMatch[1], 10) : undefined;

  // Extract page counts (e.g. "25 pages", "10 page print")
  const pageMatch = lower.match(/(\d+)\s*(?:pages|page|sheets)\b/);
  const pageCount = pageMatch ? parseInt(pageMatch[1], 10) : undefined;

  // Extract budget (e.g. "budget of 200", "₹150", "$30", "under 180")
  const budgetMatch =
    lower.match(/(?:budget of|under|within|less than|rs\.?|₹|\$)\s*(\d+)/i) ||
    lower.match(/(\d+)\s*(?:rupees|rs|bucks)/i);
  const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;

  // Intent flags
  const needsFood =
    lower.includes("lunch") ||
    lower.includes("food") ||
    lower.includes("eat") ||
    lower.includes("meal") ||
    lower.includes("canteen") ||
    lower.includes("snack");

  const wantsVegetarian =
    lower.includes("vegetarian") ||
    lower.includes("veg") ||
    lower.includes("vegan");

  const needsPrint =
    lower.includes("print") ||
    lower.includes("page") ||
    lower.includes("copies") ||
    lower.includes("copy") ||
    lower.includes("hardcopy");

  return {
    minutes,
    pageCount,
    budget,
    needsFood,
    wantsVegetarian,
    needsPrint,
  };
}

/**
 * Agent A: Central Orchestrator
 * Interprets student requests, coordinates specialist agents, evaluates schedules,
 * and produces a verified, unconfirmed draft plan.
 */
export class CentralOrchestrator {
  private repo: JsonRepository;

  constructor(repo: JsonRepository) {
    this.repo = repo;
  }

  public async coordinateRequest(
    input: OrchestratorInput
  ): Promise<CoordinatedPlan> {
    const {
      prompt,
      currentLocationId: providedLocation,
      forcedBudget,
      forcedMinutes,
      referenceTime,
      referenceDay,
    } = input;

    const student = this.repo.getStudentProfile();
    const timetable = this.repo.getTimetable();
    const locations = this.repo.getLocations();
    const printShops = this.repo.getPrintShops();
    const canteens = this.repo.getCanteens();
    const menuItems = this.repo.getMenuItems();

    // Map locations for friendly UI names
    const locationsMap: Record<string, string> = {};
    locations.forEach((loc) => {
      locationsMap[loc.id] = loc.name;
    });

    // Step 1: Request Interpretation (Gemma 4 or Deterministic Fallback)
    const gemmaIntent = await parseIntentWithGemma(prompt);
    const deterministicIntent = parsePromptDeterministic(prompt);

    const minutesRequested =
      forcedMinutes ??
      gemmaIntent?.minutes ??
      deterministicIntent.minutes;

    const pageCountRequested =
      gemmaIntent?.pageCount ??
      deterministicIntent.pageCount ??
      (deterministicIntent.needsPrint ? 25 : 0);

    const budgetConfigured =
      forcedBudget ??
      gemmaIntent?.budget ??
      deterministicIntent.budget ??
      student.defaultBudget;

    const needsFood =
      gemmaIntent?.needsFood ??
      deterministicIntent.needsFood ??
      prompt.toLowerCase().includes("lunch");

    const wantsVegetarian =
      gemmaIntent?.wantsVegetarian ??
      deterministicIntent.wantsVegetarian ??
      student.dietaryPreferences.includes("Vegetarian");

    const needsPrint =
      gemmaIntent?.needsPrint ??
      deterministicIntent.needsPrint ??
      pageCountRequested > 0;

    // Step 2: Student Day Agent Consultation
    const upcomingClassInfo = findNextClass(
      timetable,
      referenceTime,
      referenceDay
    );

    // Calculate available minutes: use explicit prompt value if given, else timetable break
    const availableMinutes =
      minutesRequested ||
      upcomingClassInfo?.minutesUntilStart ||
      35; // Default campus break

    const currentLocationId =
      providedLocation || student.preferredCampusLocation || "loc-block-a";

    // Destination location: if class exists, its building/location; default to Block A
    const destinationClassLocationId = upcomingClassInfo?.nextClass.building.includes("Block B")
      ? "loc-block-b"
      : "loc-block-a";

    // Step 3: Print Agent Consultation (Agent B)
    let printProposal:
      | (PrintEstimateResult & {
          shopLocationId: string;
          documentName?: string;
        })
      | undefined;

    if (needsPrint && pageCountRequested > 0) {
      // Choose best available shop: prefer open shop with lowest queue
      const openShops = printShops.filter((s) => s.isOpen);
      const chosenShop =
        openShops.find((s) => s.id === "shop-library") || openShops[0];

      if (chosenShop) {
        const estimate = calculatePrintEstimate({
          shop: chosenShop,
          pageCount: pageCountRequested,
          copies: 1,
          isColor: false,
          isDoubleSided: true,
        });

        printProposal = {
          ...estimate,
          shopLocationId: chosenShop.locationId,
          documentName: "Coursework_25Pages.pdf",
        };
      }
    }

    // Step 4: Canteen Agent Consultation (Agent C)
    let foodProposal:
      | (FoodEstimateResult & { canteenLocationId: string })
      | undefined;

    if (needsFood) {
      const openCanteens = canteens.filter((c) => c.isOpen);
      const chosenCanteen =
        openCanteens.find((c) => c.id === "canteen-main") || openCanteens[0];

      if (chosenCanteen) {
        // Find best items
        let recommendedItems = menuItems.filter(
          (i) => i.canteenId === chosenCanteen.id && i.isAvailable
        );

        if (wantsVegetarian) {
          recommendedItems = recommendedItems.filter((i) => i.isVegetarian);
        }

        // Pick wholesome meal: default to Mini Veg Thali or Paneer Wrap
        const preferredMeal =
          recommendedItems.find((i) => i.id === "item-veg-thali") ||
          recommendedItems.find((i) => i.id === "item-paneer-wrap") ||
          recommendedItems[0];

        if (preferredMeal) {
          const estimate = calculateFoodEstimate({
            canteen: chosenCanteen,
            items: [{ item: preferredMeal, quantity: 1 }],
          });

          foodProposal = {
            ...estimate,
            canteenLocationId: chosenCanteen.locationId,
          };
        }
      }
    }

    // Step 5: Pure TypeScript Deterministic Scheduling Engine (Agent E)
    const walkingLookup = (fromId: string, toId: string) =>
      this.repo.getWalkingMinutes(fromId, toId);

    const scheduleResult = evaluateSchedules({
      availableMinutes,
      currentLocationId,
      nextClassLocationId: destinationClassLocationId,
      safetyBufferMinutes: student.safetyBufferMinutes || 5,
      budget: budgetConfigured,
      printProposal,
      foodProposal,
      walkingLookup,
      locationsMap,
    });

    const planId = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const plan: CoordinatedPlan = {
      id: planId,
      studentId: student.id,
      createdAt: nowIso,
      userPrompt: prompt,
      availableMinutes,
      nextClass: upcomingClassInfo
        ? {
            subjectName: upcomingClassInfo.nextClass.subjectName,
            subjectCode: upcomingClassInfo.nextClass.subjectCode,
            room: upcomingClassInfo.nextClass.room,
            building: upcomingClassInfo.nextClass.building,
            locationId: destinationClassLocationId,
            startTime: upcomingClassInfo.nextClass.startTime,
            minutesUntil: upcomingClassInfo.minutesUntilStart,
          }
        : null,
      currentLocationId,
      safetyBufferMinutes: student.safetyBufferMinutes || 5,
      isFeasible: scheduleResult.bestPlan.isFeasible,
      totalCost: scheduleResult.totalCost,
      budget: budgetConfigured,
      withinBudget: scheduleResult.withinBudget,
      totalDurationMinutes: scheduleResult.bestPlan.totalDurationMinutes,
      slackMinutes: scheduleResult.bestPlan.slackMinutes,
      sequence: scheduleResult.bestPlan.sequence,
      printProposal,
      foodProposal,
      conflicts: scheduleResult.conflicts,
      reasonForFailure: scheduleResult.conflicts.length > 0
        ? scheduleResult.conflicts.join("; ")
        : undefined,
      alternatives: scheduleResult.alternatives,
      requiresConfirmation: true, // Crucial: plans NEVER execute without confirmation
      confirmed: false,
      status: "DRAFT",
    };

    // Save draft plan to persistent repository
    this.repo.savePlan(plan);

    return plan;
  }
}
