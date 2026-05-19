import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getAuthorizationUrl } from "@/lib/googleCalendar";

export async function GET() {
  try {
    await requireAuth();

    const url = getAuthorizationUrl();
    if (!url) {
      return NextResponse.json(
        { error: "Google Calendar not configured" },
        { status: 503 }
      );
    }

    return NextResponse.redirect(url);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
