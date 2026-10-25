import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";

export async function GET() {
  try {
    const repo = getRepository();
    const canteens = repo.getCanteens();
    const menuItems = repo.getMenuItems();

    return NextResponse.json({
      canteens,
      menuItems,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch canteen menu" },
      { status: 500 }
    );
  }
}
