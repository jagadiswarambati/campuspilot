import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";

export async function POST() {
  try {
    const repo = getRepository();
    const freshData = repo.reset();
    return NextResponse.json({
      success: true,
      message: "Demo database reset to factory defaults successfully.",
      version: freshData.version,
      timestamp: freshData.lastUpdated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to reset database" },
      { status: 500 }
    );
  }
}
