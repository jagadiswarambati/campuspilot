import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { calculatePrintEstimate } from "@/lib/agents/print-agent";
import { PrintEstimateSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PrintEstimateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid print options", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const shop = repo.getPrintShop(parsed.data.shopId);
    if (!shop) {
      return NextResponse.json({ error: "Print shop not found" }, { status: 404 });
    }

    const estimate = calculatePrintEstimate({
      shop,
      pageCount: parsed.data.pageCount,
      copies: parsed.data.copies,
      isColor: parsed.data.isColor,
      isDoubleSided: parsed.data.isDoubleSided,
      paperSize: parsed.data.paperSize,
    });

    return NextResponse.json({ estimate });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to calculate print estimate" },
      { status: 500 }
    );
  }
}
