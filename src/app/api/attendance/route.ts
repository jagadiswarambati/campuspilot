import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { calculateAttendanceMetrics } from "@/lib/attendance/metrics";
import { z } from "zod";

const UpdateAttendanceSchema = z.object({
  id: z.string().min(1),
  attendedClasses: z.number().int().min(0),
  totalClasses: z.number().int().min(0),
  targetPercentage: z.number().min(50).max(100).default(75),
});

export async function GET() {
  try {
    const repo = getRepository();
    const rawAttendance = repo.getAttendance();

    const enriched = rawAttendance.map((rec) => {
      const metrics = calculateAttendanceMetrics(
        rec.attendedClasses,
        rec.totalClasses,
        rec.targetPercentage
      );
      return {
        ...rec,
        ...metrics,
      };
    });

    return NextResponse.json({
      records: enriched,
      isSimulated: true,
      disclaimer: "Estimated student-managed tracking. Not an official college registrar portal.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid attendance update payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (parsed.data.attendedClasses > parsed.data.totalClasses) {
      return NextResponse.json(
        { error: "Attended classes cannot exceed total classes" },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const existing = repo.getAttendance().find((a) => a.id === parsed.data.id);
    if (!existing) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const updated = repo.updateAttendance({
      ...existing,
      attendedClasses: parsed.data.attendedClasses,
      totalClasses: parsed.data.totalClasses,
      targetPercentage: parsed.data.targetPercentage,
      updatedAt: new Date().toISOString(),
    });

    const metrics = calculateAttendanceMetrics(
      updated.attendedClasses,
      updated.totalClasses,
      updated.targetPercentage
    );

    return NextResponse.json({
      success: true,
      record: { ...updated, ...metrics },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update attendance" },
      { status: 500 }
    );
  }
}
