import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { validateTimetableOverlap } from "@/lib/timetable/validator";
import { z } from "zod";

const UpdateClassSchema = z.object({
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
  color: z.string(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = UpdateClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid class update details", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const existing = repo.getTimetable();

    const overlap = validateTimetableOverlap(existing, {
      id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    });

    if (overlap.hasOverlap) {
      return NextResponse.json({ error: overlap.message }, { status: 409 });
    }

    const updated = repo.updateTimetableClass({
      id,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, class: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update class" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const repo = getRepository();
    const success = repo.deleteTimetableClass(id);
    if (!success) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete class" },
      { status: 500 }
    );
  }
}
