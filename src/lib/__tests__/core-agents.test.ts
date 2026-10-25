import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { calculatePrintEstimate } from "../agents/print-agent";
import { calculateFoodEstimate } from "../agents/canteen-agent";
import {
  calculateBreakDuration,
  timeStringToMinutes,
  minutesToTimeString,
} from "../agents/student-day-agent";
import { evaluateSchedules } from "../scheduler/pure-scheduler";
import { JsonRepository } from "../repository/db";
import { CentralOrchestrator } from "../agents/orchestrator";
import { OrderManager } from "../agents/order-manager";
import { testGemmaConnectivity, parseIntentWithGemma } from "../gemma/client";
import { validateTimetableOverlap } from "../timetable/validator";
import { PrintShop, Canteen, MenuItem, TimetableClass } from "../../types";

const TEST_DB_PATH = path.resolve(process.cwd(), "./data/test-campus-pilot.json");

const mockPrintShop: PrintShop = {
  id: "shop-test",
  name: "Test Print Shop",
  locationId: "loc-library",
  building: "Central Library",
  bwSinglePrice: 2.0,
  bwDoublePrice: 1.5,
  colorSinglePrice: 10.0,
  colorDoublePrice: 8.0,
  pagesPerMinute: 20,
  currentQueuePages: 40,
  queueWaitMinutesPer100Pages: 5,
  isOpen: true,
  supportedSizes: ["A4"],
};

const mockCanteen: Canteen = {
  id: "canteen-test",
  name: "Test Canteen",
  locationId: "loc-canteen",
  building: "Student Center",
  isOpen: true,
  currentWaitMinutes: 2,
};

const mockItemAvailable: MenuItem = {
  id: "item-thali",
  canteenId: "canteen-test",
  name: "Veg Thali",
  description: "Wholesome lunch",
  category: "Meal",
  isVegetarian: true,
  isVegan: false,
  price: 110,
  preparationMinutes: 8,
  isAvailable: true,
};

const mockItemUnavailable: MenuItem = {
  id: "item-out",
  canteenId: "canteen-test",
  name: "Special Pasta",
  description: "Out of stock item",
  category: "Meal",
  isVegetarian: true,
  isVegan: false,
  price: 130,
  preparationMinutes: 10,
  isAvailable: false,
};

describe("CampusPilot AI - Core Requirements & Architecture Verification", () => {
  let testRepo: JsonRepository;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    testRepo = new JsonRepository(TEST_DB_PATH);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  // 1. Print-price calculation
  it("Requirement 1: Calculates standard B&W print price correctly", () => {
    const result = calculatePrintEstimate({
      shop: mockPrintShop,
      pageCount: 25,
      copies: 1,
      isColor: false,
      isDoubleSided: true,
    });
    // 25 pages * 1.50 per page = 37.50
    expect(result.totalCost).toBe(37.5);
    expect(result.unitPricePerPage).toBe(1.5);
    expect(result.totalPages).toBe(25);
  });

  // 2. Multiple copies
  it("Requirement 2: Calculates total pages and price for multiple copies", () => {
    const result = calculatePrintEstimate({
      shop: mockPrintShop,
      pageCount: 25,
      copies: 3,
      isColor: false,
      isDoubleSided: true,
    });
    // 25 * 3 = 75 total pages
    expect(result.totalPages).toBe(75);
    // 75 * 1.50 = 112.50
    expect(result.totalCost).toBe(112.5);
  });

  // 3. Colour versus black-and-white pricing
  it("Requirement 3: Differentiates colour and black-and-white prices accurately", () => {
    const bwResult = calculatePrintEstimate({
      shop: mockPrintShop,
      pageCount: 10,
      copies: 1,
      isColor: false,
      isDoubleSided: false,
    });
    const colorResult = calculatePrintEstimate({
      shop: mockPrintShop,
      pageCount: 10,
      copies: 1,
      isColor: true,
      isDoubleSided: false,
    });

    expect(bwResult.unitPricePerPage).toBe(2.0); // BW single
    expect(bwResult.totalCost).toBe(20.0);
    expect(colorResult.unitPricePerPage).toBe(10.0); // Color single
    expect(colorResult.totalCost).toBe(100.0);
    expect(colorResult.totalCost).toBeGreaterThan(bwResult.totalCost);
  });

  // 4. Food total calculation
  it("Requirement 4: Accurately calculates food total cost and preparation duration", () => {
    const foodEstimate = calculateFoodEstimate({
      canteen: mockCanteen,
      items: [
        { item: mockItemAvailable, quantity: 2 }, // 110 * 2 = 220
      ],
    });
    expect(foodEstimate.totalCost).toBe(220);
    // Prep time: max(8) + canteen wait (2) = 10 min
    expect(foodEstimate.preparationMinutes).toBe(10);
    expect(foodEstimate.isVegetarianOnly).toBe(true);
  });

  // 5. Available-break calculation
  it("Requirement 5: Calculates break duration between class periods correctly", () => {
    const breakMinutes = calculateBreakDuration("12:00", "12:35");
    expect(breakMinutes).toBe(35);

    const morningBreak = calculateBreakDuration("10:15", "11:00");
    expect(morningBreak).toBe(45);

    expect(timeStringToMinutes("12:35")).toBe(755);
    expect(minutesToTimeString(755)).toBe("12:35");
  });

  // 6. A feasible combined schedule
  it("Requirement 6: Validates a feasible lunch-and-print request within 35 minutes", () => {
    const printProposal = {
      ...calculatePrintEstimate({
        shop: mockPrintShop,
        pageCount: 25,
        copies: 1,
        isColor: false,
        isDoubleSided: true,
      }),
      shopLocationId: "loc-library",
    };

    const foodProposal = {
      ...calculateFoodEstimate({
        canteen: mockCanteen,
        items: [{ item: mockItemAvailable, quantity: 1 }],
      }),
      canteenLocationId: "loc-canteen",
    };

    const walkingLookup = (from: string, to: string) => {
      if (from === to) return 0;
      if (
        (from === "loc-block-a" && to === "loc-canteen") ||
        (from === "loc-canteen" && to === "loc-block-a")
      )
        return 4;
      if (
        (from === "loc-canteen" && to === "loc-library") ||
        (from === "loc-library" && to === "loc-canteen")
      )
        return 3;
      return 3;
    };

    const result = evaluateSchedules({
      availableMinutes: 35,
      currentLocationId: "loc-block-a",
      nextClassLocationId: "loc-block-a",
      safetyBufferMinutes: 5,
      budget: 250,
      printProposal,
      foodProposal,
      walkingLookup,
    });

    expect(result.bestPlan.isFeasible).toBe(true);
    expect(result.bestPlan.slackMinutes).toBeGreaterThanOrEqual(0);
    expect(result.conflicts.length).toBe(0);
    expect(result.withinBudget).toBe(true);
  });

  // 7. An infeasible combined schedule
  it("Requirement 7: Rejects an infeasible schedule with an impossibly tight deadline", () => {
    const printProposal = {
      ...calculatePrintEstimate({
        shop: mockPrintShop,
        pageCount: 25,
        copies: 1,
        isColor: false,
        isDoubleSided: true,
      }),
      shopLocationId: "loc-library",
    };

    const foodProposal = {
      ...calculateFoodEstimate({
        canteen: mockCanteen,
        items: [{ item: mockItemAvailable, quantity: 1 }],
      }),
      canteenLocationId: "loc-canteen",
    };

    const walkingLookup = () => 4;

    const result = evaluateSchedules({
      availableMinutes: 12, // Impossible: tasks need ~25-28 min
      currentLocationId: "loc-block-a",
      nextClassLocationId: "loc-block-a",
      safetyBufferMinutes: 5,
      budget: 250,
      printProposal,
      foodProposal,
      walkingLookup,
    });

    expect(result.bestPlan.isFeasible).toBe(false);
    expect(result.bestPlan.slackMinutes).toBeLessThan(0);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0]).toContain("Schedule Overrun");
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  // 8. Alternative task ordering
  it("Requirement 8: Evaluates pipelined task ordering vs purely sequential ordering", () => {
    const printProposal = {
      ...calculatePrintEstimate({
        shop: mockPrintShop,
        pageCount: 25,
        copies: 1,
        isColor: false,
        isDoubleSided: true,
      }),
      shopLocationId: "loc-library",
    };

    const foodProposal = {
      ...calculateFoodEstimate({
        canteen: mockCanteen,
        items: [{ item: mockItemAvailable, quantity: 1 }],
      }),
      canteenLocationId: "loc-canteen",
    };

    const walkingLookup = (from: string, to: string) => (from === to ? 0 : 3);

    const result = evaluateSchedules({
      availableMinutes: 35,
      currentLocationId: "loc-block-a",
      nextClassLocationId: "loc-block-a",
      safetyBufferMinutes: 5,
      budget: 250,
      printProposal,
      foodProposal,
      walkingLookup,
    });

    expect(result.allSequences.length).toBe(2);
    const pipelined = result.allSequences.find((s) => s.name.includes("Pipelined"));
    const sequential = result.allSequences.find((s) => s.name.includes("Sequential"));
    expect(pipelined).toBeDefined();
    expect(sequential).toBeDefined();
    // Both sequences are evaluated and compared
    expect(pipelined?.sequence.length).toBeGreaterThan(0);
  });

  // 9. Walking-time handling
  it("Requirement 9: Accurately incorporates configured walking times between campus hubs", () => {
    const walkAB = testRepo.getWalkingMinutes("loc-block-a", "loc-block-b");
    const walkALib = testRepo.getWalkingMinutes("loc-block-a", "loc-library");
    const sameLoc = testRepo.getWalkingMinutes("loc-block-a", "loc-block-a");

    expect(walkAB).toBe(5);
    expect(walkALib).toBe(3);
    expect(sameLoc).toBe(0);
  });

  // 10. Safety-buffer handling
  it("Requirement 10: Enforces safety buffer before class so students are never late", () => {
    const printProposal = {
      ...calculatePrintEstimate({
        shop: mockPrintShop,
        pageCount: 10,
        copies: 1,
        isColor: false,
        isDoubleSided: true,
      }),
      shopLocationId: "loc-library",
    };

    const walkingLookup = () => 2;

    // Total duration ~ 8 min. Available = 10 min.
    // If safetyBuffer is 5 min -> required = 13 min -> infeasible!
    const withBuffer = evaluateSchedules({
      availableMinutes: 10,
      currentLocationId: "loc-block-a",
      nextClassLocationId: "loc-block-a",
      safetyBufferMinutes: 5,
      budget: 100,
      printProposal,
      walkingLookup,
    });

    expect(withBuffer.bestPlan.isFeasible).toBe(false);

    // If safetyBuffer is 1 min -> required = 9 min -> feasible!
    const withoutBuffer = evaluateSchedules({
      availableMinutes: 10,
      currentLocationId: "loc-block-a",
      nextClassLocationId: "loc-block-a",
      safetyBufferMinutes: 1,
      budget: 100,
      printProposal,
      walkingLookup,
    });

    expect(withoutBuffer.bestPlan.isFeasible).toBe(true);
  });

  // 11. Missing or unavailable items
  it("Requirement 11: Rejects unavailable or out-of-stock menu items", () => {
    expect(() => {
      calculateFoodEstimate({
        canteen: mockCanteen,
        items: [{ item: mockItemUnavailable, quantity: 1 }],
      });
    }).toThrow(/currently unavailable\/out of stock/i);
  });

  // 12. Budget constraints
  it("Requirement 12: Detects budget overruns and proposes alternatives", () => {
    const printProposal = {
      ...calculatePrintEstimate({
        shop: mockPrintShop,
        pageCount: 50,
        copies: 2,
        isColor: true,
        isDoubleSided: false,
      }),
      shopLocationId: "loc-library",
    };

    // 100 pages * ₹10 = ₹1000
    const walkingLookup = () => 2;

    const result = evaluateSchedules({
      availableMinutes: 45,
      currentLocationId: "loc-block-a",
      nextClassLocationId: "loc-block-a",
      safetyBufferMinutes: 5,
      budget: 150, // Budget is 150, but print alone is 1000!
      printProposal,
      walkingLookup,
    });

    expect(result.withinBudget).toBe(false);
    expect(result.conflicts.some((c) => c.includes("Budget Exceeded"))).toBe(true);
    expect(result.alternatives.some((a) => a.id === "alt-economy-print")).toBe(true);
  });

  // 13. Order creation only after confirmation
  it("Requirement 13: Plans remain unconfirmed drafts until explicit student confirmation", async () => {
    const orchestrator = new CentralOrchestrator(testRepo);
    const plan = await orchestrator.coordinateRequest({
      prompt: "I have 35 minutes. Need vegetarian lunch and 25 pages printed.",
      referenceTime: "12:00",
      referenceDay: "Monday",
    });

    expect(plan.requiresConfirmation).toBe(true);
    expect(plan.confirmed).toBe(false);
    expect(plan.status).toBe("DRAFT");
    expect(testRepo.getPrintOrders().length).toBe(0);
    expect(testRepo.getFoodOrders().length).toBe(0);

    const orderManager = new OrderManager(testRepo);
    const confirmResult = orderManager.confirmPlan(plan.id);

    expect(confirmResult.success).toBe(true);
    expect(confirmResult.plan.status).toBe("CONFIRMED");
    expect(testRepo.getPrintOrders().length).toBe(1);
    expect(testRepo.getFoodOrders().length).toBe(1);
  });

  // 14. Duplicate-order prevention
  it("Requirement 14: Prevents duplicate order confirmation on the same plan", async () => {
    const orchestrator = new CentralOrchestrator(testRepo);
    const plan = await orchestrator.coordinateRequest({
      prompt: "35 minutes before class, 25 pages print and veg lunch.",
    });

    const orderManager = new OrderManager(testRepo);
    orderManager.confirmPlan(plan.id);

    // Second confirmation attempt must be rejected
    expect(() => {
      orderManager.confirmPlan(plan.id);
    }).toThrow(/already been confirmed/i);
  });

  // 15. Server-side validation of submitted totals
  it("Requirement 15: Validates prices server-side rather than trusting client-supplied numbers", async () => {
    const orchestrator = new CentralOrchestrator(testRepo);
    const plan = await orchestrator.coordinateRequest({
      prompt: "Need 25 pages printed.",
    });

    // Tamper with plan object in memory to simulate a malicious client payload
    if (plan.printProposal) {
      plan.printProposal.totalCost = 1.0; // Faked 1 rupee instead of 37.50
    }
    testRepo.savePlan(plan);

    const orderManager = new OrderManager(testRepo);
    const confirmed = orderManager.confirmPlan(plan.id);

    // Verified price on server must be 37.50, NOT the tampered 1.0
    expect(confirmed.printOrder?.totalCost).toBe(37.5);
  });

  // 16. Demo mode without an API key
  it("Requirement 16: Works transparently in demo mode without an API key", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const status = await testGemmaConnectivity();
    expect(status.demoMode).toBe(true);
    expect(status.provider).toBe("demo");
    expect(status.connected).toBe(false);

    process.env.GEMINI_API_KEY = prevKey;
  });

  // 17. Invalid AI responses
  it("Requirement 17: Falls back gracefully if AI fails or returns empty response", async () => {
    // When Gemma is in demo mode or encounters failure, parseIntentWithGemma returns null
    // and orchestrator seamlessly uses the deterministic parser
    const result = await parseIntentWithGemma("gibberish");
    expect(result).toBeNull(); // Clean fallback

    const orchestrator = new CentralOrchestrator(testRepo);
    const plan = await orchestrator.coordinateRequest({
      prompt: "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed.",
    });

    expect(plan).toBeDefined();
    expect(plan.printProposal?.pageCount).toBe(25);
    expect(plan.foodProposal?.isVegetarianOnly).toBe(true);
  });

  // 18. Missing or invalid API credentials
  it("Requirement 18: Handles invalid API credentials cleanly without leaking secrets", async () => {
    process.env.DEMO_MODE = "false";
    process.env.GEMINI_API_KEY = "AIzaSyFakeKeyForTesting123456789";

    const status = await testGemmaConnectivity();
    expect(status.connected).toBe(false);
    expect(status.message).not.toContain("AIzaSyFakeKeyForTesting123456789"); // No leaks!

    process.env.DEMO_MODE = "true";
  });

  // 19. Persistence across application restarts
  it("Requirement 19: Persists data across repository re-instantiations", () => {
    testRepo.addNote({
      studentId: "student-alex-01",
      title: "Persistence Verification Note",
      content: "This note should survive an application restart.",
      category: "academic",
      isPinned: true,
    });

    // Re-initialize repository instance from same file path
    const restartedRepo = new JsonRepository(TEST_DB_PATH);
    const notes = restartedRepo.getNotes();
    const found = notes.find((n) => n.title === "Persistence Verification Note");

    expect(found).toBeDefined();
    expect(found?.content).toBe("This note should survive an application restart.");
  });

  // 20. Timetable-overlap validation
  it("Requirement 20: Validates timetable overlaps correctly", () => {
    const existingClasses: TimetableClass[] = [
      {
        id: "c1",
        subjectCode: "CS301",
        subjectName: "Algorithms",
        instructor: "Dr. Adams",
        room: "A-204",
        building: "Block A",
        dayOfWeek: "Monday",
        startTime: "10:00",
        endTime: "11:30",
        color: "#8b5cf6",
      },
    ];

    // Overlapping candidate: Monday 10:30 to 12:00
    const overlapResult = validateTimetableOverlap(existingClasses, {
      dayOfWeek: "Monday",
      startTime: "10:30",
      endTime: "12:00",
    });
    expect(overlapResult.hasOverlap).toBe(true);
    expect(overlapResult.conflictingClass?.subjectCode).toBe("CS301");

    // Non-overlapping candidate: Monday 11:30 to 13:00
    const validResult = validateTimetableOverlap(existingClasses, {
      dayOfWeek: "Monday",
      startTime: "11:30",
      endTime: "13:00",
    });
    expect(validResult.hasOverlap).toBe(false);

    // Different day: Tuesday 10:00 to 11:30
    const differentDayResult = validateTimetableOverlap(existingClasses, {
      dayOfWeek: "Tuesday",
      startTime: "10:00",
      endTime: "11:30",
    });
    expect(differentDayResult.hasOverlap).toBe(false);
  });

  // Complete End-to-End Workflow Integration Test
  it("End-to-End Integration: Complete request-to-confirmation workflow for 35 min lunch & print", async () => {
    const orchestrator = new CentralOrchestrator(testRepo);
    const orderManager = new OrderManager(testRepo);

    // 1. Student asks the core question
    const prompt =
      "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late.";

    const plan = await orchestrator.coordinateRequest({
      prompt,
      referenceTime: "12:00",
      referenceDay: "Monday",
    });

    // 2. System parses and builds coordinated plan
    expect(plan.availableMinutes).toBe(35);
    expect(plan.isFeasible).toBe(true);
    expect(plan.printProposal).toBeDefined();
    expect(plan.printProposal?.pageCount).toBe(25);
    expect(plan.foodProposal).toBeDefined();
    expect(plan.foodProposal?.isVegetarianOnly).toBe(true);
    expect(plan.sequence.length).toBeGreaterThan(0);
    expect(plan.requiresConfirmation).toBe(true);
    expect(plan.status).toBe("DRAFT");

    // 3. Explicit student confirmation
    const confirmResult = orderManager.confirmPlan(plan.id);
    expect(confirmResult.success).toBe(true);
    expect(confirmResult.plan.status).toBe("CONFIRMED");
    expect(confirmResult.printOrder).toBeDefined();
    expect(confirmResult.printOrder?.isSimulated).toBe(true);
    expect(confirmResult.foodOrder).toBeDefined();
    expect(confirmResult.foodOrder?.isSimulated).toBe(true);

    // 4. Stored in database
    const savedPrintOrders = testRepo.getPrintOrders();
    const savedFoodOrders = testRepo.getFoodOrders();
    expect(savedPrintOrders.length).toBe(1);
    expect(savedFoodOrders.length).toBe(1);
    expect(savedPrintOrders[0].id).toBe(confirmResult.printOrder?.id);
    expect(savedFoodOrders[0].id).toBe(confirmResult.foodOrder?.id);
  });
});
