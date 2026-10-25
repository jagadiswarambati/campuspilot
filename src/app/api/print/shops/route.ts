import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";

export async function GET() {
  try {
    const repo = getRepository();
    const shops = repo.getPrintShops();
    return NextResponse.json({ shops });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch print shops" },
      { status: 500 }
    );
  }
}
