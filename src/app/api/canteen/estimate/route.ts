import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { calculateFoodEstimate } from "@/lib/agents/canteen-agent";
import { FoodEstimateSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = FoodEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid food estimate options", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const canteen = repo.getCanteen(parsed.data.canteenId);
    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    const items = parsed.data.items.map((i) => {
      const item = repo.getMenuItem(i.itemId);
      if (!item) {
        throw new Error(`Item ${i.itemId} not found`);
      }
      return { item, quantity: i.quantity };
    });

    const estimate = calculateFoodEstimate({ canteen, items });
    return NextResponse.json({ estimate });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to calculate food estimate" },
      { status: 400 }
    );
  }
}
