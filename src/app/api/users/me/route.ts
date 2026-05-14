import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET() {
  try {
    const userId = await requireAuth();
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    }).from(users).where(eq(users.id, userId)).limit(1);
    return NextResponse.json(user ?? null);
  } catch (e) {
    return handleError(e);
  }
}
