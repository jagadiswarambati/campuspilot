import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { OrderManager } from "@/lib/agents/order-manager";
import { ConfirmPlanRequestSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ConfirmPlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid confirmation payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const orderManager = new OrderManager(repo);

    const result = orderManager.confirmPlan(parsed.data.planId);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Order confirmation API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to confirm plan" },
      { status: 400 }
    );
  }
}
