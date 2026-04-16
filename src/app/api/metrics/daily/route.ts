import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { metricsService } from "@/services/metrics.service";

export async function GET(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Parametros 'from' e 'to' obrigatorios" },
      { status: 400 }
    );
  }

  const daily = await metricsService.getDaily(
    result.userId,
    new Date(from),
    new Date(to)
  );

  return NextResponse.json(daily);
}
