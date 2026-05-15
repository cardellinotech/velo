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
      const {
        defaultCurrency,
        businessName,
        businessAddress,
        vatId,
        taxRate,
        bankName,
        iban,
        bic,
        paymentTermDays,
        invoicePrefix,
      } = body;
      const fieldsToUpdate: Partial<typeof userSettings.$inferInsert> = {};
      if (defaultCurrency !== undefined) fieldsToUpdate.defaultCurrency = defaultCurrency;
      if (businessName !== undefined) fieldsToUpdate.businessName = businessName;
      if (businessAddress !== undefined) fieldsToUpdate.businessAddress = businessAddress;
      if (vatId !== undefined) fieldsToUpdate.vatId = vatId;
      if (taxRate !== undefined) fieldsToUpdate.taxRate = taxRate;
      if (bankName !== undefined) fieldsToUpdate.bankName = bankName;
      if (iban !== undefined) fieldsToUpdate.iban = iban;
      if (bic !== undefined) fieldsToUpdate.bic = bic;
      if (paymentTermDays !== undefined) fieldsToUpdate.paymentTermDays = paymentTermDays;
      if (invoicePrefix !== undefined) fieldsToUpdate.invoicePrefix = invoicePrefix;

      if (Object.keys(fieldsToUpdate).length === 0) {
        return NextResponse.json(existing);
      }

      const [updated] = await db
        .update(userSettings)
        .set(fieldsToUpdate)
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
