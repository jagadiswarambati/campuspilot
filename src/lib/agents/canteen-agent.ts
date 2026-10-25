import { MenuItem, Canteen, FoodEstimateResult } from "../../types";

export interface CalculateFoodOptions {
  canteen: Canteen;
  items: {
    item: MenuItem;
    quantity: number;
  }[];
}

/**
 * Deterministic pricing and duration calculation for Canteen orders.
 * Never invents menu items, prices, or availability.
 */
export function calculateFoodEstimate(
  options: CalculateFoodOptions
): FoodEstimateResult {
  const { canteen, items } = options;

  if (items.length === 0) {
    throw new Error("Cannot calculate estimate with an empty food cart");
  }

  let totalCost = 0;
  let maxPrepMinutes = 0;
  let isVegetarianOnly = true;

  const itemDetails = items.map(({ item, quantity }) => {
    if (quantity <= 0) {
      throw new Error(`Quantity for ${item.name} must be greater than zero`);
    }
    if (!item.isAvailable) {
      throw new Error(`Item "${item.name}" is currently unavailable/out of stock`);
    }

    const subtotal = Math.round(item.price * quantity * 100) / 100;
    totalCost += subtotal;

    if (!item.isVegetarian) {
      isVegetarianOnly = false;
    }

    if (item.preparationMinutes > maxPrepMinutes) {
      maxPrepMinutes = item.preparationMinutes;
    }

    return {
      id: item.id,
      name: item.name,
      quantity,
      unitPrice: item.price,
      subtotal,
      preparationMinutes: item.preparationMinutes,
      isVegetarian: item.isVegetarian,
    };
  });

  // Concurrent preparation with small overhead for multiple items
  // Total prep time = max(item prep) + (items count > 1 ? 1 : 0) + canteen current queue wait
  const canteenWait = canteen.currentWaitMinutes || 0;
  const prepOverhead = items.length > 1 ? 1 : 0;
  const preparationMinutes = maxPrepMinutes + prepOverhead + canteenWait;

  return {
    canteenId: canteen.id,
    canteenName: canteen.name,
    items: itemDetails,
    totalCost: Math.round(totalCost * 100) / 100,
    preparationMinutes,
    isVegetarianOnly,
  };
}

/**
 * Find recommended vegetarian lunch options that fit within a budget and time target.
 */
export function findRecommendedVegMeal(
  availableItems: MenuItem[],
  budget: number,
  maxPrepMinutes: number = 15
): MenuItem[] {
  // Filter for available vegetarian meals
  const vegOptions = availableItems.filter(
    (i) => i.isAvailable && i.isVegetarian && i.price <= budget && i.preparationMinutes <= maxPrepMinutes
  );

  // Prefer "Meal" category first
  const meals = vegOptions.filter((i) => i.category === "Meal");
  if (meals.length > 0) {
    // Sort by preparation time ascending to be fast
    return meals.sort((a, b) => a.preparationMinutes - b.preparationMinutes);
  }

  // Fallback to Snacks
  return vegOptions.sort((a, b) => a.preparationMinutes - b.preparationMinutes);
}
