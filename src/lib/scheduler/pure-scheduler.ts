import {
  PlanStep,
  CoordinatedPlan,
  PlanAlternative,
  PrintEstimateResult,
  FoodEstimateResult,
} from "../../types";

export interface ScheduleEvaluationInput {
  availableMinutes: number;
  currentLocationId: string;
  nextClassLocationId: string;
  safetyBufferMinutes: number;
  budget: number;
  printProposal?: PrintEstimateResult & {
    shopLocationId: string;
    documentName?: string;
  };
  foodProposal?: FoodEstimateResult & {
    canteenLocationId: string;
  };
  walkingLookup: (fromId: string, toId: string) => number;
  locationsMap?: Record<string, string>; // id -> name
}

export interface EvaluatedSequence {
  name: string;
  sequence: PlanStep[];
  totalDurationMinutes: number;
  isFeasible: boolean;
  slackMinutes: number;
}

/**
 * Pure TypeScript Deterministic Scheduling Engine (Agent E).
 * Calculates exact step timings, detects schedule conflicts, and evaluates task orderings.
 */
export function evaluateSchedules(
  input: ScheduleEvaluationInput
): {
  bestPlan: EvaluatedSequence;
  allSequences: EvaluatedSequence[];
  conflicts: string[];
  alternatives: PlanAlternative[];
  totalCost: number;
  withinBudget: boolean;
} {
  const {
    availableMinutes,
    currentLocationId,
    nextClassLocationId,
    safetyBufferMinutes,
    budget,
    printProposal,
    foodProposal,
    walkingLookup,
    locationsMap = {},
  } = input;

  const getLocationName = (id: string) => locationsMap[id] || id;

  const printCost = printProposal ? printProposal.totalCost : 0;
  const foodCost = foodProposal ? foodProposal.totalCost : 0;
  const totalCost = Math.round((printCost + foodCost) * 100) / 100;
  const withinBudget = totalCost <= budget;

  const evaluatedSequences: EvaluatedSequence[] = [];

  // Case 1: Both Print and Food requested
  if (printProposal && foodProposal) {
    const printLoc = printProposal.shopLocationId;
    const foodLoc = foodProposal.canteenLocationId;

    // Sequence 1: Sequential [Print First -> Food Second]
    {
      const steps: PlanStep[] = [];
      let currentMinute = 0;
      let stepNum = 1;

      // 1. Walk to print shop
      const walkToPrint = walkingLookup(currentLocationId, printLoc);
      if (walkToPrint > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "WALK",
          title: `Walk to ${printProposal.shopName}`,
          location: getLocationName(printLoc),
          locationId: printLoc,
          startMinute: currentMinute,
          endMinute: currentMinute + walkToPrint,
          durationMinutes: walkToPrint,
          details: `Walk ${walkToPrint} min from current location to print shop`,
        });
        currentMinute += walkToPrint;
      }

      // 2. Print job (queue + printing)
      const printDur = printProposal.totalDurationMinutes;
      steps.push({
        stepNumber: stepNum++,
        actionType: "PRINT_ORDER",
        title: `Submit and Print ${printProposal.totalPages} Pages`,
        location: printProposal.shopName,
        locationId: printLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + printDur,
        durationMinutes: printDur,
        details: `Queue wait: ${printProposal.queueMinutes}m | Print: ${printProposal.printMinutes}m | Cost: ₹${printProposal.totalCost}`,
      });
      currentMinute += printDur;

      // 3. Walk to canteen
      const walkPrintToFood = walkingLookup(printLoc, foodLoc);
      if (walkPrintToFood > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "WALK",
          title: `Walk to ${foodProposal.canteenName}`,
          location: getLocationName(foodLoc),
          locationId: foodLoc,
          startMinute: currentMinute,
          endMinute: currentMinute + walkPrintToFood,
          durationMinutes: walkPrintToFood,
          details: `Walk ${walkPrintToFood} min to canteen counter`,
        });
        currentMinute += walkPrintToFood;
      }

      // 4. Food order & preparation
      const foodDur = foodProposal.preparationMinutes;
      steps.push({
        stepNumber: stepNum++,
        actionType: "FOOD_ORDER",
        title: `Place Order & Pick up Meal`,
        location: foodProposal.canteenName,
        locationId: foodLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + foodDur,
        durationMinutes: foodDur,
        details: `Fresh prep: ${foodDur}m for ${foodProposal.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`,
      });
      currentMinute += foodDur;

      // 5. Walk to class
      const walkToClass = walkingLookup(foodLoc, nextClassLocationId);
      if (walkToClass > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "TRAVEL_TO_CLASS",
          title: "Walk to Next Class",
          location: getLocationName(nextClassLocationId),
          locationId: nextClassLocationId,
          startMinute: currentMinute,
          endMinute: currentMinute + walkToClass,
          durationMinutes: walkToClass,
          details: `Walk ${walkToClass} min to lecture hall before class starts`,
        });
        currentMinute += walkToClass;
      }

      const totalDurationMinutes = currentMinute;
      const slackMinutes =
        availableMinutes - (totalDurationMinutes + safetyBufferMinutes);
      const isFeasible = slackMinutes >= 0;

      evaluatedSequences.push({
        name: "Print First, Then Canteen (Sequential)",
        sequence: steps,
        totalDurationMinutes,
        isFeasible,
        slackMinutes,
      });
    }

    // Sequence 2: Pipelined / Smart Sequence [Order Food First -> Print while cooking -> Pickup Food -> Class]
    {
      const steps: PlanStep[] = [];
      let currentMinute = 0;
      let stepNum = 1;

      // 1. Walk to Canteen to place order early
      const walkToCanteen = walkingLookup(currentLocationId, foodLoc);
      if (walkToCanteen > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "WALK",
          title: `Walk to ${foodProposal.canteenName} Express Counter`,
          location: getLocationName(foodLoc),
          locationId: foodLoc,
          startMinute: currentMinute,
          endMinute: currentMinute + walkToCanteen,
          durationMinutes: walkToCanteen,
          details: `Walk ${walkToCanteen} min to place order so kitchen begins preparation immediately`,
        });
        currentMinute += walkToCanteen;
      }

      // 2. Place food order (takes 1 minute to submit)
      const orderPlaceDuration = 1;
      steps.push({
        stepNumber: stepNum++,
        actionType: "FOOD_ORDER",
        title: `Order Meal via Express Counter`,
        location: foodProposal.canteenName,
        locationId: foodLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + orderPlaceDuration,
        durationMinutes: orderPlaceDuration,
        details: `Order placed! Kitchen starts preparation (${foodProposal.preparationMinutes} min total prep)`,
      });
      const foodReadyAtMinute = currentMinute + foodProposal.preparationMinutes;
      currentMinute += orderPlaceDuration;

      // 3. Walk to Print Shop while food is preparing
      const walkToPrint = walkingLookup(foodLoc, printLoc);
      if (walkToPrint > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "WALK",
          title: `Walk to ${printProposal.shopName}`,
          location: getLocationName(printLoc),
          locationId: printLoc,
          startMinute: currentMinute,
          endMinute: currentMinute + walkToPrint,
          durationMinutes: walkToPrint,
          details: `Walk ${walkToPrint} min to print shop during kitchen cooking time`,
        });
        currentMinute += walkToPrint;
      }

      // 4. Print job
      const printDur = printProposal.totalDurationMinutes;
      steps.push({
        stepNumber: stepNum++,
        actionType: "PRINT_ORDER",
        title: `Collect Prints (${printProposal.totalPages} Pages)`,
        location: printProposal.shopName,
        locationId: printLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + printDur,
        durationMinutes: printDur,
        details: `Print completed: ₹${printProposal.totalCost} (${printProposal.queueMinutes}m queue + ${printProposal.printMinutes}m print)`,
      });
      currentMinute += printDur;

      // 5. Walk back to Canteen to pick up ready food
      const walkBackToCanteen = walkingLookup(printLoc, foodLoc);
      if (walkBackToCanteen > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "WALK",
          title: `Return to Canteen for Pickup`,
          location: getLocationName(foodLoc),
          locationId: foodLoc,
          startMinute: currentMinute,
          endMinute: currentMinute + walkBackToCanteen,
          durationMinutes: walkBackToCanteen,
          details: `Walk ${walkBackToCanteen} min to pickup desk`,
        });
        currentMinute += walkBackToCanteen;
      }

      // 6. Food pickup
      const waitRemaining = Math.max(0, foodReadyAtMinute - currentMinute);
      const pickupDuration = waitRemaining + 1; // 1 min pickup handoff
      steps.push({
        stepNumber: stepNum++,
        actionType: "FOOD_PICKUP",
        title: `Pick up Prepared Food`,
        location: foodProposal.canteenName,
        locationId: foodLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + pickupDuration,
        durationMinutes: pickupDuration,
        details: waitRemaining > 0
          ? `Wait ${waitRemaining} min for final hot packing and collect tray`
          : `Food is freshly ready upon arrival! Grab packed order.`,
      });
      currentMinute += pickupDuration;

      // 7. Walk to class
      const walkToClass = walkingLookup(foodLoc, nextClassLocationId);
      if (walkToClass > 0) {
        steps.push({
          stepNumber: stepNum++,
          actionType: "TRAVEL_TO_CLASS",
          title: "Walk to Next Class",
          location: getLocationName(nextClassLocationId),
          locationId: nextClassLocationId,
          startMinute: currentMinute,
          endMinute: currentMinute + walkToClass,
          durationMinutes: walkToClass,
          details: `Walk ${walkToClass} min to lecture hall before class starts`,
        });
        currentMinute += walkToClass;
      }

      const totalDurationMinutes = currentMinute;
      const slackMinutes =
        availableMinutes - (totalDurationMinutes + safetyBufferMinutes);
      const isFeasible = slackMinutes >= 0;

      evaluatedSequences.push({
        name: "Order Food First, Print While Cooking, Pickup & Go (Pipelined)",
        sequence: steps,
        totalDurationMinutes,
        isFeasible,
        slackMinutes,
      });
    }
  } else if (printProposal) {
    // Only Print requested
    const printLoc = printProposal.shopLocationId;
    const steps: PlanStep[] = [];
    let currentMinute = 0;
    let stepNum = 1;

    const walkToPrint = walkingLookup(currentLocationId, printLoc);
    if (walkToPrint > 0) {
      steps.push({
        stepNumber: stepNum++,
        actionType: "WALK",
        title: `Walk to ${printProposal.shopName}`,
        location: getLocationName(printLoc),
        locationId: printLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + walkToPrint,
        durationMinutes: walkToPrint,
        details: `Walk ${walkToPrint} min to shop`,
      });
      currentMinute += walkToPrint;
    }

    const printDur = printProposal.totalDurationMinutes;
    steps.push({
      stepNumber: stepNum++,
      actionType: "PRINT_ORDER",
      title: `Print Document (${printProposal.totalPages} Pages)`,
      location: printProposal.shopName,
      locationId: printLoc,
      startMinute: currentMinute,
      endMinute: currentMinute + printDur,
      durationMinutes: printDur,
      details: `Queue: ${printProposal.queueMinutes}m, Print: ${printProposal.printMinutes}m`,
    });
    currentMinute += printDur;

    const walkToClass = walkingLookup(printLoc, nextClassLocationId);
    if (walkToClass > 0) {
      steps.push({
        stepNumber: stepNum++,
        actionType: "TRAVEL_TO_CLASS",
        title: "Walk to Next Class",
        location: getLocationName(nextClassLocationId),
        locationId: nextClassLocationId,
        startMinute: currentMinute,
        endMinute: currentMinute + walkToClass,
        durationMinutes: walkToClass,
        details: `Walk ${walkToClass} min to class`,
      });
      currentMinute += walkToClass;
    }

    const totalDurationMinutes = currentMinute;
    const slackMinutes =
      availableMinutes - (totalDurationMinutes + safetyBufferMinutes);
    const isFeasible = slackMinutes >= 0;

    evaluatedSequences.push({
      name: "Print Document",
      sequence: steps,
      totalDurationMinutes,
      isFeasible,
      slackMinutes,
    });
  } else if (foodProposal) {
    // Only Food requested
    const foodLoc = foodProposal.canteenLocationId;
    const steps: PlanStep[] = [];
    let currentMinute = 0;
    let stepNum = 1;

    const walkToFood = walkingLookup(currentLocationId, foodLoc);
    if (walkToFood > 0) {
      steps.push({
        stepNumber: stepNum++,
        actionType: "WALK",
        title: `Walk to ${foodProposal.canteenName}`,
        location: getLocationName(foodLoc),
        locationId: foodLoc,
        startMinute: currentMinute,
        endMinute: currentMinute + walkToFood,
        durationMinutes: walkToFood,
        details: `Walk ${walkToFood} min to canteen`,
      });
      currentMinute += walkToFood;
    }

    const foodDur = foodProposal.preparationMinutes;
    steps.push({
      stepNumber: stepNum++,
      actionType: "FOOD_ORDER",
      title: "Order & Pick up Food",
      location: foodProposal.canteenName,
      locationId: foodLoc,
      startMinute: currentMinute,
      endMinute: currentMinute + foodDur,
      durationMinutes: foodDur,
      details: `Prep time ${foodDur} min for selected items`,
    });
    currentMinute += foodDur;

    const walkToClass = walkingLookup(foodLoc, nextClassLocationId);
    if (walkToClass > 0) {
      steps.push({
        stepNumber: stepNum++,
        actionType: "TRAVEL_TO_CLASS",
        title: "Walk to Next Class",
        location: getLocationName(nextClassLocationId),
        locationId: nextClassLocationId,
        startMinute: currentMinute,
        endMinute: currentMinute + walkToClass,
        durationMinutes: walkToClass,
        details: `Walk ${walkToClass} min to class`,
      });
      currentMinute += walkToClass;
    }

    const totalDurationMinutes = currentMinute;
    const slackMinutes =
      availableMinutes - (totalDurationMinutes + safetyBufferMinutes);
    const isFeasible = slackMinutes >= 0;

    evaluatedSequences.push({
      name: "Canteen Meal Order",
      sequence: steps,
      totalDurationMinutes,
      isFeasible,
      slackMinutes,
    });
  }

  // Sort sequences: prefer feasible first, then lowest duration
  evaluatedSequences.sort((a, b) => {
    if (a.isFeasible && !b.isFeasible) return -1;
    if (!a.isFeasible && b.isFeasible) return 1;
    return a.totalDurationMinutes - b.totalDurationMinutes;
  });

  const bestPlan = evaluatedSequences[0] || {
    name: "Empty Plan",
    sequence: [],
    totalDurationMinutes: 0,
    isFeasible: false,
    slackMinutes: availableMinutes,
  };

  const conflicts: string[] = [];
  if (!bestPlan.isFeasible) {
    const requiredTotal = bestPlan.totalDurationMinutes + safetyBufferMinutes;
    conflicts.push(
      `Schedule Overrun: Requested tasks require ${bestPlan.totalDurationMinutes} min + ${safetyBufferMinutes} min safety buffer (${requiredTotal} min total), but you only have ${availableMinutes} min before your next class.`
    );
  }

  if (!withinBudget) {
    conflicts.push(
      `Budget Exceeded: Combined estimated cost is ₹${totalCost}, which exceeds your allocated budget of ₹${budget} by ₹${(totalCost - budget).toFixed(2)}.`
    );
  }

  // Generate realistic, deterministic alternatives if infeasible or tight
  const alternatives: PlanAlternative[] = [];

  // Alternative A: If pipelined isn't feasible or time is tight, offer Quick Snack instead of Meal
  if (foodProposal && (!bestPlan.isFeasible || bestPlan.slackMinutes < 3)) {
    const expressFoodDuration = 3; // e.g. Cold Coffee / Fruit bowl
    const expressFoodCost = 45;
    const adjustedCost = (printCost || 0) + expressFoodCost;
    const walkTotal =
      walkingLookup(currentLocationId, foodProposal.canteenLocationId) +
      walkingLookup(
        foodProposal.canteenLocationId,
        printProposal ? printProposal.shopLocationId : nextClassLocationId
      ) +
      walkingLookup(
        printProposal ? printProposal.shopLocationId : foodProposal.canteenLocationId,
        nextClassLocationId
      );
    const printDur = printProposal ? printProposal.totalDurationMinutes : 0;
    const altTotalMinutes = walkTotal + expressFoodDuration + printDur;
    const altSlack = availableMinutes - (altTotalMinutes + safetyBufferMinutes);

    alternatives.push({
      id: "alt-express-food",
      title: "Switch to Express Grab-and-Go Snack",
      description:
        "Replace hot kitchen meal with a ready-to-go fruit bowl or iced cold coffee (2-3 min prep).",
      changes: "Saves 5-7 minutes of food preparation time.",
      estimatedMinutes: altTotalMinutes,
      estimatedCost: adjustedCost,
      isFeasible: altSlack >= 0,
    });
  }

  // Alternative B: Priority Print only (postpone food)
  if (printProposal && foodProposal && !bestPlan.isFeasible) {
    const walkPrint =
      walkingLookup(currentLocationId, printProposal.shopLocationId) +
      walkingLookup(printProposal.shopLocationId, nextClassLocationId);
    const printOnlyMinutes = walkPrint + printProposal.totalDurationMinutes;
    const printSlack = availableMinutes - (printOnlyMinutes + safetyBufferMinutes);

    alternatives.push({
      id: "alt-print-only",
      title: "Print Now, Eat After Class",
      description:
        "Complete the urgent 25-page printout now before lecture. Order lunch during the afternoon break.",
      changes: `Reduces total time to ${printOnlyMinutes} min (leaves ${printSlack} min buffer).`,
      estimatedMinutes: printOnlyMinutes,
      estimatedCost: printProposal.totalCost,
      isFeasible: printSlack >= 0,
    });
  }

  // Alternative C: Lower page count / BW single sided if budget exceeded
  if (!withinBudget && printProposal) {
    alternatives.push({
      id: "alt-economy-print",
      title: "Switch to Standard Black & White Duplex",
      description: "Ensure economical print settings and single meal item.",
      changes: "Reduces print cost and fits within your configured budget.",
      estimatedMinutes: bestPlan.totalDurationMinutes,
      estimatedCost: Math.min(budget, totalCost * 0.8),
      isFeasible: bestPlan.isFeasible,
    });
  }

  return {
    bestPlan,
    allSequences: evaluatedSequences,
    conflicts,
    alternatives,
    totalCost,
    withinBudget,
  };
}
