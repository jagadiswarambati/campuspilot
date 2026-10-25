import {
  CoordinatedPlan,
  PrintOrder,
  FoodOrder,
} from "../../types";
import { JsonRepository } from "../repository/db";
import { calculatePrintEstimate } from "./print-agent";
import { calculateFoodEstimate } from "./canteen-agent";

export interface ConfirmPlanResult {
  success: boolean;
  message: string;
  plan: CoordinatedPlan;
  printOrder?: PrintOrder;
  foodOrder?: FoodOrder;
}

/**
 * Agent F: Order and Confirmation Manager
 * Enforces explicit student confirmation, prevents duplicate order creation,
 * and re-verifies prices/feasibility server-side.
 */
export class OrderManager {
  private repo: JsonRepository;

  constructor(repo: JsonRepository) {
    this.repo = repo;
  }

  /**
   * Confirm a pending plan and create simulated orders.
   * Strictly enforces:
   * 1. Plan exists and is in DRAFT status.
   * 2. Cannot confirm twice (duplicate prevention).
   * 3. Re-validates prices on server.
   */
  public confirmPlan(planId: string): ConfirmPlanResult {
    const plan = this.repo.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} was not found`);
    }

    if (plan.status === "CONFIRMED") {
      throw new Error(
        `Plan ${planId} has already been confirmed. Duplicate submissions are rejected.`
      );
    }

    if (plan.status === "CANCELLED") {
      throw new Error(`Plan ${planId} was cancelled and cannot be confirmed.`);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    let createdPrintOrder: PrintOrder | undefined;
    let createdFoodOrder: FoodOrder | undefined;

    // Server-side validation of print proposal
    if (plan.printProposal) {
      const shop = this.repo.getPrintShop(plan.printProposal.shopId);
      if (!shop) {
        throw new Error(`Print shop ${plan.printProposal.shopId} no longer exists`);
      }

      // Re-calculate verified price on server
      const verifiedPrintEstimate = calculatePrintEstimate({
        shop,
        pageCount: plan.printProposal.pageCount,
        copies: plan.printProposal.copies,
        isColor: plan.printProposal.isColor,
        isDoubleSided: plan.printProposal.isDoubleSided,
      });

      const readyDate = new Date(
        now.getTime() + verifiedPrintEstimate.totalDurationMinutes * 60000
      );

      const printOrderId = `PO-${Date.now().toString().slice(-6)}-${Math.floor(
        Math.random() * 1000
      )}`;

      createdPrintOrder = {
        id: printOrderId,
        planId: plan.id,
        studentId: plan.studentId,
        shopId: shop.id,
        shopName: shop.name,
        documentName:
          plan.printProposal.documentName || "Coursework_Document.pdf",
        pageCount: plan.printProposal.pageCount,
        copies: plan.printProposal.copies,
        isColor: plan.printProposal.isColor,
        isDoubleSided: plan.printProposal.isDoubleSided,
        paperSize: "A4",
        totalCost: verifiedPrintEstimate.totalCost,
        status: "QUEUED",
        estimatedReadyTime: readyDate.toISOString(),
        createdAt: nowIso,
        isSimulated: true, // Clearly identified as simulated demo order
      };

      this.repo.addPrintOrder(createdPrintOrder);
    }

    // Server-side validation of food proposal
    if (plan.foodProposal) {
      const canteen = this.repo.getCanteen(plan.foodProposal.canteenId);
      if (!canteen) {
        throw new Error(
          `Canteen ${plan.foodProposal.canteenId} no longer exists`
        );
      }

      // Re-verify items and re-calculate total
      const itemsToVerify = plan.foodProposal.items.map((i) => {
        const menuItem = this.repo.getMenuItem(i.id);
        if (!menuItem) {
          throw new Error(`Menu item ${i.name} no longer exists`);
        }
        return { item: menuItem, quantity: i.quantity };
      });

      const verifiedFoodEstimate = calculateFoodEstimate({
        canteen,
        items: itemsToVerify,
      });

      const readyDate = new Date(
        now.getTime() + verifiedFoodEstimate.preparationMinutes * 60000
      );

      const foodOrderId = `FO-${Date.now().toString().slice(-6)}-${Math.floor(
        Math.random() * 1000
      )}`;

      createdFoodOrder = {
        id: foodOrderId,
        planId: plan.id,
        studentId: plan.studentId,
        canteenId: canteen.id,
        canteenName: canteen.name,
        items: verifiedFoodEstimate.items.map((i) => ({
          itemId: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
        totalCost: verifiedFoodEstimate.totalCost,
        status: "RECEIVED",
        estimatedReadyTime: readyDate.toISOString(),
        createdAt: nowIso,
        isSimulated: true,
      };

      this.repo.addFoodOrder(createdFoodOrder);
    }

    // Update plan status
    plan.status = "CONFIRMED";
    plan.confirmed = true;
    plan.simulatedOrderIds = {
      printOrderId: createdPrintOrder?.id,
      foodOrderId: createdFoodOrder?.id,
    };

    this.repo.savePlan(plan);

    return {
      success: true,
      message: "Plan confirmed successfully. Simulated orders created.",
      plan,
      printOrder: createdPrintOrder,
      foodOrder: createdFoodOrder,
    };
  }

  /**
   * Cancel a draft plan
   */
  public cancelPlan(planId: string): CoordinatedPlan {
    const plan = this.repo.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan with ID ${planId} was not found`);
    }

    if (plan.status === "CONFIRMED") {
      throw new Error(`Cannot cancel a plan that has already been confirmed.`);
    }

    plan.status = "CANCELLED";
    this.repo.savePlan(plan);
    return plan;
  }
}
