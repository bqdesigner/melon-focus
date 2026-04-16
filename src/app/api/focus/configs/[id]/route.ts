import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { focusConfigService } from "@/services/focus-config.service";
import { updateFocusConfigSchema } from "@/lib/validators/focus-config";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateFocusConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const config = await focusConfigService.update(
    result.userId,
    id,
    parsed.data
  );

  if (!config) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(config);
}

export async function DELETE(_request: Request, { params }: Params) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { id } = await params;

  try {
    const deleted = await focusConfigService.delete(result.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFIG_IN_USE") {
      return NextResponse.json(
        { error: "Config em uso por sessoes existentes" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
