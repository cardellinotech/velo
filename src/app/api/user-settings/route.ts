import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";

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

const DEFAULTS = {
  defaultCurrency: "EUR",
  invoicePrefix: "RE",
  nextInvoiceNumber: 1,
  businessName: null,
  businessAddress: null,
  vatId: null,
  taxRate: null,
  bankName: null,
  iban: null,
  bic: null,
  paymentTermDays: null,
};

export async function GET() {
  try {
    const userId = await requireAuth();
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return NextResponse.json(settings ?? { ...DEFAULTS, userId, id: null });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();

    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ ...body })
        .where(eq(userSettings.userId, userId))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({
          userId,
          defaultCurrency: body.defaultCurrency ?? "EUR",
          businessName: body.businessName ?? null,
          businessAddress: body.businessAddress ?? null,
          vatId: body.vatId ?? null,
          taxRate: body.taxRate ?? null,
          bankName: body.bankName ?? null,
          iban: body.iban ?? null,
          bic: body.bic ?? null,
          paymentTermDays: body.paymentTermDays ?? null,
          invoicePrefix: body.invoicePrefix ?? "RE",
          nextInvoiceNumber: body.nextInvoiceNumber ?? 1,
        })
        .returning();
      return NextResponse.json(created);
    }
  } catch (e) {
    return handleError(e);
  }
}
