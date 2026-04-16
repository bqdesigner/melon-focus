import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { focusSessionService } from "@/services/focus-session.service";
import { startSessionSchema } from "@/lib/validators/focus-session";

export async function GET(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const data = await focusSessionService.list(result.userId, {
    objectiveId: searchParams.get("objectiveId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: Number(searchParams.get("limit")) || 20,
    offset: Number(searchParams.get("offset")) || 0,
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const body = await request.json();
  const parsed = startSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const session = await focusSessionService.start(result.userId, parsed.data);
    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno";
    if (message === "CONFIG_NOT_FOUND" || message === "OBJECTIVE_NOT_FOUND") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
