import { NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repo = getRepository();
    const student = repo.getStudentProfile();
    return NextResponse.json({
      status: "ok",
      app: "CampusPilot AI",
      timestamp: new Date().toISOString(),
      studentName: student.name,
      database: "online",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
