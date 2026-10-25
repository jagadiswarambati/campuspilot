import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { calculatePrintEstimate } from "@/lib/agents/print-agent";
import { PrintEstimateSchema } from "@/types";

export async function GET() {
  try {
    const repo = getRepository();
    const orders = repo.getPrintOrders();
    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch print orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PrintEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid print order request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const shop = repo.getPrintShop(parsed.data.shopId);
    if (!shop) {
      return NextResponse.json({ error: "Print shop not found" }, { status: 404 });
    }

    const student = repo.getStudentProfile();
    const estimate = calculatePrintEstimate({
      shop,
      pageCount: parsed.data.pageCount,
      copies: parsed.data.copies,
      isColor: parsed.data.isColor,
      isDoubleSided: parsed.data.isDoubleSided,
      paperSize: parsed.data.paperSize,
    });

    const now = new Date();
    const readyDate = new Date(
      now.getTime() + estimate.totalDurationMinutes * 60000
    );

    const order = repo.addPrintOrder({
      id: `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      shopId: shop.id,
      shopName: shop.name,
      documentName: parsed.data.documentName || "Uploaded_Document.pdf",
      pageCount: parsed.data.pageCount,
      copies: parsed.data.copies,
      isColor: parsed.data.isColor,
      isDoubleSided: parsed.data.isDoubleSided,
      paperSize: parsed.data.paperSize,
      totalCost: estimate.totalCost,
      status: "QUEUED",
      estimatedReadyTime: readyDate.toISOString(),
      createdAt: now.toISOString(),
      isSimulated: true,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit print order" },
      { status: 500 }
    );
  }
}
