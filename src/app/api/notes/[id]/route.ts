import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { z } from "zod";

const UpdateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(["academic", "tasks", "print", "food", "general"]),
  isPinned: z.boolean(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const parsed = UpdateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid note update", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const existing = repo.getNotes().find((n) => n.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const updated = repo.updateNote({
      ...existing,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update note" },
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
    const success = repo.deleteNote(id);
    if (!success) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
