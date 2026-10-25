import { NextResponse } from "next/server";
import { testGemmaConnectivity } from "@/lib/gemma/client";

export async function GET() {
  try {
    const status = await testGemmaConnectivity();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        provider: "demo",
        model: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
        demoMode: true,
        message: err.message || "Failed to check model connectivity",
        lastChecked: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
