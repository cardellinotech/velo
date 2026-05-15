import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { fetchCodaRows } from "@/lib/coda-sync";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const { codaApiToken, codaDocId, codaTableId, columnName } = await req.json() as {
      codaApiToken: string;
      codaDocId: string;
      codaTableId: string;
      columnName: string;
    };

    const { rows, error } = await fetchCodaRows(codaApiToken, codaDocId, codaTableId);
    if (error && rows.length === 0) {
      return NextResponse.json({ success: false, error });
    }

    const values = [...new Set(rows.map((r) => String(r[columnName] ?? "").trim()).filter(Boolean))].sort();
    return NextResponse.json({ success: true, values });
  } catch (e) {
    return handleError(e);
  }
}
