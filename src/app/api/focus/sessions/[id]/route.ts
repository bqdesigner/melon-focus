import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { focusSessionService } from "@/services/focus-session.service";
import { finishSessionSchema } from "@/lib/validators/focus-session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const session = await focusSessionService.getById(result.userId, id);

  if (!session) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PATCH(request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const { action, ...data } = body;

  if (action === "finish") {
    const parsed = finishSessionSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const session = await focusSessionService.finish(
      result.userId,
      id,
      parsed.data
    );
    if (!session) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }
    return NextResponse.json(session);
  }

  if (action === "cancel") {
    const session = await focusSessionService.cancel(result.userId, id);
    if (!session) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }
    return NextResponse.json(session);
  }

  if (action === "add_interval") {
    const interval = await focusSessionService.addInterval(
      result.userId,
      id,
      data.type
    );
    if (!interval) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }
    return NextResponse.json(interval);
  }

  return NextResponse.json({ error: "Acao invalida" }, { status: 400 });
}
