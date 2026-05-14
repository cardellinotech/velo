import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const { codaApiToken, codaDocId, codaTableId } = await req.json() as {
      codaApiToken: string;
      codaDocId: string;
      codaTableId: string;
    };

    const url = `https://coda.io/apis/v1/docs/${encodeURIComponent(codaDocId)}/tables/${encodeURIComponent(codaTableId)}/columns`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${codaApiToken}` } });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ success: false, error: "Invalid API token or insufficient permissions" });
      }
      if (res.status === 404) {
        return NextResponse.json({ success: false, error: "Document or table not found" });
      }
      return NextResponse.json({ success: false, error: `Coda API error: ${res.status}` });
    }

    const data = (await res.json()) as { items: { name: string }[] };
    const columns = data.items.map((col) => col.name);
    return NextResponse.json({ success: true, columns });
  } catch (e) {
    return handleError(e);
  }
}
