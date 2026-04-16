import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { userService } from "@/services/user.service";

export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  const data = await userService.exportData(result.userId);

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="melon-focus-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
