import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  dietaryPreferences: z.array(z.string()),
  defaultBudget: z.number().positive(),
  preferredCampusLocation: z.string().min(1),
  safetyBufferMinutes: z.number().int().min(1).max(30),
  theme: z.enum(["dark", "light"]),
});

export async function GET() {
  try {
    const repo = getRepository();
    const student = repo.getStudentProfile();
    return NextResponse.json({ profile: student });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid profile payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const updated = repo.updateStudentProfile(parsed.data);
    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
