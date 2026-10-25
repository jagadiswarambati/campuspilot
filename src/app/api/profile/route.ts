import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  studentId: z.string().optional(),
  role: z
    .enum(["Student", "Faculty", "Administrator", "Other College Staff", "Other"])
    .optional(),
  onboardingCompleted: z.boolean().optional(),
  department: z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  defaultBudget: z.number().positive().optional(),
  preferredCampusLocation: z.string().min(1).optional(),
  safetyBufferMinutes: z.number().int().min(1).max(30).optional(),
  theme: z.enum(["dark", "light"]).optional(),
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

export async function POST(req: NextRequest) {
  return PUT(req);
}
