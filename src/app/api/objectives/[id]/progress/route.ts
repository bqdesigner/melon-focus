import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { objectiveService } from "@/services/objective.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const progress = await objectiveService.getProgress(result.userId, id);

  if (!progress) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(progress);
}
