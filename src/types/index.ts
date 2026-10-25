import { z } from "zod";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface StudentProfile {
  id: string;
  name: string;
  studentId: string;
  email: string;
  dietaryPreferences: string[]; // e.g. ["vegetarian", "vegan", "halal"]
  defaultBudget: number; // in currency units (e.g. ₹ or $)
  preferredCampusLocation: string; // e.g. "Main Academic Block"
  safetyBufferMinutes: number; // default safety margin before class (e.g. 5 min)
  theme: "dark" | "light";
}

export interface TimetableClass {
  id: string;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  room: string;
  building: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm" (24hr)
  endTime: string; // "HH:mm"
  color: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  building: string;
  description: string;
}

export interface WalkingTime {
  fromLocationId: string;
  toLocationId: string;
  minutes: number;
}

export interface PrintShop {
  id: string;
  name: string;
  locationId: string;
  building: string;
  bwSinglePrice: number;
  bwDoublePrice: number;
  colorSinglePrice: number;
  colorDoublePrice: number;
  pagesPerMinute: number;
  currentQueuePages: number;
  queueWaitMinutesPer100Pages: number;
  isOpen: boolean;
  supportedSizes: ("A4" | "A3")[];
}

export interface PrintOrderEstimateRequest {
  shopId: string;
  pageCount: number;
  copies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperSize: "A4" | "A3";
  documentName?: string;
}

export interface PrintEstimateResult {
  shopId: string;
  shopName: string;
  pageCount: number;
  copies: number;
  totalPages: number;
  isColor: boolean;
  isDoubleSided: boolean;
  unitPricePerPage: number;
  totalCost: number;
  queueMinutes: number;
  printMinutes: number;
  totalDurationMinutes: number;
}

export interface MenuItem {
  id: string;
  canteenId: string;
  name: string;
  description: string;
  category: "Meal" | "Snack" | "Beverage" | "Dessert";
  isVegetarian: boolean;
  isVegan: boolean;
  price: number;
  preparationMinutes: number;
  isAvailable: boolean;
  calories?: number;
}

export interface Canteen {
  id: string;
  name: string;
  locationId: string;
  building: string;
  isOpen: boolean;
  currentWaitMinutes: number;
}

export interface FoodOrderEstimateRequest {
  canteenId: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
}

export interface FoodEstimateResult {
  canteenId: string;
  canteenName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    preparationMinutes: number;
    isVegetarian: boolean;
  }[];
  totalCost: number;
  preparationMinutes: number;
  isVegetarianOnly: boolean;
}

export type ActionStepType =
  | "WALK"
  | "PRINT_ORDER"
  | "PRINT_PICKUP"
  | "FOOD_ORDER"
  | "FOOD_PREPARATION"
  | "FOOD_PICKUP"
  | "TRAVEL_TO_CLASS";

export interface PlanStep {
  stepNumber: number;
  actionType: ActionStepType;
  title: string;
  location: string;
  locationId?: string;
  startMinute: number; // offset from plan start (0 = now)
  endMinute: number;
  durationMinutes: number;
  details: string;
}

export interface PlanAlternative {
  id: string;
  title: string;
  description: string;
  changes: string;
  estimatedMinutes: number;
  estimatedCost: number;
  isFeasible: boolean;
  adjustedPageCount?: number;
  adjustedItems?: { id: string; name: string; quantity: number }[];
  adjustedSequence?: PlanStep[];
}

export interface CoordinatedPlan {
  id: string;
  studentId: string;
  createdAt: string;
  userPrompt: string;
  availableMinutes: number;
  nextClass: {
    subjectName: string;
    subjectCode: string;
    room: string;
    building: string;
    locationId: string;
    startTime: string;
    minutesUntil: number;
  } | null;
  currentLocationId: string;
  safetyBufferMinutes: number;
  isFeasible: boolean;
  totalCost: number;
  budget: number;
  withinBudget: boolean;
  totalDurationMinutes: number;
  slackMinutes: number;
  sequence: PlanStep[];
  printProposal?: PrintEstimateResult & { documentName?: string };
  foodProposal?: FoodEstimateResult;
  conflicts: string[];
  reasonForFailure?: string;
  alternatives: PlanAlternative[];
  requiresConfirmation: boolean;
  confirmed: boolean;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  simulatedOrderIds?: {
    printOrderId?: string;
    foodOrderId?: string;
  };
}

export interface PrintOrder {
  id: string;
  planId?: string;
  studentId: string;
  shopId: string;
  shopName: string;
  documentName: string;
  pageCount: number;
  copies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperSize: "A4" | "A3";
  totalCost: number;
  status: "QUEUED" | "PRINTING" | "READY" | "COMPLETED";
  estimatedReadyTime: string;
  createdAt: string;
  isSimulated: boolean;
}

export interface FoodOrder {
  id: string;
  planId?: string;
  studentId: string;
  canteenId: string;
  canteenName: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  totalCost: number;
  status: "RECEIVED" | "PREPARING" | "READY" | "PICKED_UP";
  estimatedReadyTime: string;
  createdAt: string;
  isSimulated: boolean;
}

export interface AttendanceRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  attendedClasses: number;
  totalClasses: number;
  targetPercentage: number; // e.g. 75 or 85
  updatedAt: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  title: string;
  content: string;
  category: "academic" | "tasks" | "print" | "food" | "general";
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiConnectionStatus {
  connected: boolean;
  provider: "gemma" | "demo";
  model: string;
  demoMode: boolean;
  message: string;
  lastChecked: string;
}

// Zod schemas for validation
export const PrintEstimateSchema = z.object({
  shopId: z.string().min(1),
  pageCount: z.number().int().positive(),
  copies: z.number().int().positive().default(1),
  isColor: z.boolean().default(false),
  isDoubleSided: z.boolean().default(true),
  paperSize: z.enum(["A4", "A3"]).default("A4"),
  documentName: z.string().optional(),
});

export const FoodEstimateSchema = z.object({
  canteenId: z.string().min(1),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

export const AssistantRequestSchema = z.object({
  prompt: z.string().min(2),
  currentLocationId: z.string().optional(),
  budget: z.number().positive().optional(),
  availableMinutes: z.number().positive().optional(),
});

export const ConfirmPlanRequestSchema = z.object({
  planId: z.string().min(1),
});
