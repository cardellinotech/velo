import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getEventsForWeek } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const url = new URL(req.url);
    const weekStart = url.searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart query param required" }, { status: 400 });
    }

    const events = await getEventsForWeek(userId, weekStart);
    return NextResponse.json(events);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    // Return empty array on error — calendar is optional
    return NextResponse.json([]);
  }
}
