import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { objectiveService } from "@/services/objective.service";
import { createObjectiveSchema } from "@/lib/validators/objective";

export async function GET(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const objectives = await objectiveService.list(result.userId, status);
  return NextResponse.json(objectives);
}

export async function POST(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const body = await request.json();
  const parsed = createObjectiveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const objective = await objectiveService.create(result.userId, parsed.data);
  return NextResponse.json(objective, { status: 201 });
}
