import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { findNextClass } from "@/lib/agents/student-day-agent";
import { validateTimetableOverlap } from "@/lib/timetable/validator";
import { z } from "zod";

const ClassSchema = z.object({
  subjectCode: z.string().min(1),
  subjectName: z.string().min(1),
  instructor: z.string().min(1),
  room: z.string().min(1),
  building: z.string().min(1),
  dayOfWeek: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  color: z.string().default("#8b5cf6"),
});

export async function GET() {
  try {
    const repo = getRepository();
    const timetable = repo.getTimetable();
    const nextClassInfo = findNextClass(timetable);

    return NextResponse.json({
      classes: timetable,
      nextClassInfo,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid class details", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const existingClasses = repo.getTimetable();

    // Check overlap
    const overlap = validateTimetableOverlap(existingClasses, {
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    });

    if (overlap.hasOverlap) {
      return NextResponse.json(
        { error: overlap.message },
        { status: 409 } // Conflict
      );
    }

    const newClass = repo.addTimetableClass(parsed.data);
    return NextResponse.json({ success: true, class: newClass }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add class" },
      { status: 500 }
    );
  }
}
