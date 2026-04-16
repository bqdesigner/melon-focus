import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { objectiveService } from "@/services/objective.service";
import { updateObjectiveSchema } from "@/lib/validators/objective";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const objective = await objectiveService.getById(result.userId, id);

  if (!objective) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(objective);
}

export async function PATCH(request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateObjectiveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const objective = await objectiveService.update(
    result.userId,
    id,
    parsed.data
  );

  if (!objective) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(objective);
}

export async function DELETE(_request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const deleted = await objectiveService.delete(result.userId, id);

  if (!deleted) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
