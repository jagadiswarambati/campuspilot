import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { z } from "zod";

const NoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(["academic", "tasks", "print", "food", "general"]).default("general"),
  isPinned: z.boolean().default(false),
});

export async function GET() {
  try {
    const repo = getRepository();
    const notes = repo.getNotes();
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = NoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid note data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const student = repo.getStudentProfile();
    const newNote = repo.addNote({
      studentId: student.id,
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category,
      isPinned: parsed.data.isPinned,
    });

    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
