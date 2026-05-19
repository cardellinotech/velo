import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { isConnected } from "@/lib/googleCalendar";

export async function GET() {
  try {
    const userId = await requireAuth();
    const connected = await isConnected(userId);
    return NextResponse.json({ connected });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
