import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { calculateFoodEstimate } from "@/lib/agents/canteen-agent";
import { FoodEstimateSchema } from "@/types";

export async function GET() {
  try {
    const repo = getRepository();
    const orders = repo.getFoodOrders();
    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch food orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = FoodEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid food order request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const canteen = repo.getCanteen(parsed.data.canteenId);
    if (!canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    const student = repo.getStudentProfile();
    const items = parsed.data.items.map((i) => {
      const item = repo.getMenuItem(i.itemId);
      if (!item) {
        throw new Error(`Item ${i.itemId} not found`);
      }
      return { item, quantity: i.quantity };
    });

    const estimate = calculateFoodEstimate({ canteen, items });

    const now = new Date();
    const readyDate = new Date(
      now.getTime() + estimate.preparationMinutes * 60000
    );

    const order = repo.addFoodOrder({
      id: `FO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      canteenId: canteen.id,
      canteenName: canteen.name,
      items: estimate.items.map((i) => ({
        itemId: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      totalCost: estimate.totalCost,
      status: "RECEIVED",
      estimatedReadyTime: readyDate.toISOString(),
      createdAt: now.toISOString(),
      isSimulated: true,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit food order" },
      { status: 400 }
    );
  }
}
