import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { focusConfigService } from "@/services/focus-config.service";
import { createFocusConfigSchema } from "@/lib/validators/focus-config";

export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  const configs = await focusConfigService.list(result.userId);
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const body = await request.json();
  const parsed = createFocusConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const config = await focusConfigService.create(result.userId, parsed.data);
  return NextResponse.json(config, { status: 201 });
}
