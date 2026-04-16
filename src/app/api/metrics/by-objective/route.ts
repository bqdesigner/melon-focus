import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { metricsService } from "@/services/metrics.service";

export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  const data = await metricsService.getByObjective(result.userId);
  return NextResponse.json(data);
}
