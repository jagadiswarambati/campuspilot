import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository/db";
import { CentralOrchestrator } from "@/lib/agents/orchestrator";
import { AssistantRequestSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AssistantRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { prompt, currentLocationId, budget, availableMinutes } = parsed.data;
    const repo = getRepository();
    const orchestrator = new CentralOrchestrator(repo);

    const plan = await orchestrator.coordinateRequest({
      prompt,
      currentLocationId,
      forcedBudget: budget,
      forcedMinutes: availableMinutes,
    });

    return NextResponse.json({
      plan,
      isSimulated: true,
      message: plan.isFeasible
        ? "Coordinated plan generated successfully. Please review and confirm to simulate placing orders."
        : "Plan cannot fit safely within the available time window without conflicts. Review suggested alternatives.",
    });
  } catch (err: any) {
    console.error("Orchestrator API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to coordinate campus plan" },
      { status: 500 }
    );
  }
}
