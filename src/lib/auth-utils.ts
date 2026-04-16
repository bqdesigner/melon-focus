import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get authenticated user ID from session.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Guard for API routes. Returns userId or error response.
 */
export async function requireAuth(): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  const userId = await getAuthUserId();
  if (!userId) {
    return {
      error: NextResponse.json({ error: "Nao autenticado" }, { status: 401 }),
    };
  }
  return { userId };
}
