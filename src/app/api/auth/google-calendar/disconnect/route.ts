import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { disconnectGoogleCalendar } from "@/lib/googleCalendar";

export async function DELETE() {
  try {
    const userId = await requireAuth();
    await disconnectGoogleCalendar(userId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
