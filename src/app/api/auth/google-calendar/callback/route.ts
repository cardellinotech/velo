import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { exchangeCodeForTokens } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();

    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/settings?google_calendar=error", req.url));
    }

    const success = await exchangeCodeForTokens(code, userId);

    if (success) {
      return NextResponse.redirect(new URL("/settings?google_calendar=connected", req.url));
    } else {
      return NextResponse.redirect(new URL("/settings?google_calendar=error", req.url));
    }
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    console.error(e);
    return NextResponse.redirect(new URL("/settings?google_calendar=error", req.url));
  }
}
