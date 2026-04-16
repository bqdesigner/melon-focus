import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { userService } from "@/services/user.service";

export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  const profile = await userService.getProfile(result.userId);
  if (!profile) {
    return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const result = await requireAuth();
  if (result.error) return result.error;

  const body = await request.json();
  const { name, image } = body;

  const updated = await userService.updateProfile(result.userId, {
    name,
    image,
  });

  return NextResponse.json(updated);
}
