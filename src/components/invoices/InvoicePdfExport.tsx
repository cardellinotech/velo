"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

function pdfFormatAmount(amount: number, currency: string): string {
  const formatted = amount.toFixed(2);
  if (currency === "CHF") return `${formatted} CHF`;
  const symbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${formatted}`;
}

interface LineItem {
  date?: number;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: number;
  dueDate: number;
  periodStart?: number;
  periodEnd?: number;
  paymentTermDays?: number;
  currency: string;
  clientName: string;
  clientAddress?: string;
  senderName: string;
  senderAddress?: string;
  vatId?: string;
  taxRate?: number;
  bankName?: string;
  iban?: string;
  bic?: string;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount?: number;
  total: number;
  notes?: string;
}

const NAVY = "#1d3557";
const ACCENT = "#2563eb";
const TEXT_DARK = "#111827";
const TEXT_MED = "#374151";
const TEXT_LIGHT = "#6b7280";
const BORDER = "#e5e7eb";
const ROW_ALT = "#f9fafb";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    paddingBottom: 60,
    backgroundColor: "#ffffff",
    color: TEXT_DARK,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  senderBlock: { flexDirection: "column", maxWidth: "60%" },
  senderName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: TEXT_DARK,
    marginBottom: 4,
  },
  senderAddress: {
    fontSize: 9,
    color: TEXT_LIGHT,
    lineHeight: 1.5,
  },
  invoiceHeadingBlock: { alignItems: "flex-end" },
  invoiceHeading: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: TEXT_DARK,
    letterSpacing: 1,
  },
  invoiceNumberLabel: {
    fontSize: 11,
    color: ACCENT,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },

  // Divider
  divider: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginBottom: 16,
  },

  // Info section
  infoSection: {
    flexDirection: "row",
    marginBottom: 20,
  },
  billedToBlock: { flex: 1 },
  billedToLabel: {
    fontSize: 7,
    color: TEXT_LIGHT,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: TEXT_DARK,
    marginBottom: 3,
  },
  clientAddress: {
    fontSize: 9,
    color: TEXT_MED,
    lineHeight: 1.5,
  },
  metaTable: { width: "55%" },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  metaRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 8,
    color: TEXT_LIGHT,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaValue: {
    fontSize: 8,
    color: TEXT_DARK,
    fontFamily: "Helvetica-Bold",
  },
  metaValueAccent: {
    fontSize: 9,
    color: ACCENT,
    fontFamily: "Helvetica-Bold",
  },

  // Table
  table: { marginBottom: 0 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: ROW_ALT },
  tableTotalRow: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },

  colDate: { width: 65 },
  colDescription: { flex: 1 },
  colHours: { width: 48, textAlign: "right" },
  colRate: { width: 68, textAlign: "right" },
  colAmount: { width: 75, textAlign: "right" },

  thText: {
    fontSize: 8,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tdText: { fontSize: 9, color: TEXT_MED },
  tdBold: { fontSize: 9, color: TEXT_DARK, fontFamily: "Helvetica-Bold" },
  tdTotalWhite: { fontSize: 9, color: "#ffffff" },
  tdTotalWhiteBold: { fontSize: 10, color: "#ffffff", fontFamily: "Helvetica-Bold" },

  // Bottom section
  bottomSection: {
    flexDirection: "row",
    marginTop: 20,
    gap: 24,
  },
  paymentBlock: { flex: 1 },
  notesBlock: { flex: 1 },
  sectionLabel: {
    fontSize: 7,
    color: TEXT_LIGHT,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  paymentKey: {
    fontSize: 9,
    color: TEXT_MED,
    width: 85,
  },
  paymentVal: {
    fontSize: 9,
    color: TEXT_DARK,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  notesText: {
    fontSize: 9,
    color: TEXT_MED,
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    textAlign: "center",
    fontSize: 7.5,
    color: TEXT_LIGHT,
  },
});

function formatMetaDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function formatLineItemDate(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function formatPeriod(start: number, end: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const s = new Date(start);
  const e = new Date(end);
  const startStr = `${months[s.getMonth()]} ${String(s.getDate()).padStart(2, "0")}`;
  const endStr = `${months[e.getMonth()]} ${String(e.getDate()).padStart(2, "0")}, ${e.getFullYear()}`;
  return `${startStr} – ${endStr}`;
}

function InvoicePdfDocument({ invoice }: { invoice: InvoicePdfData }) {
  const { lineItems, total, currency } = invoice;
  const totalHours = lineItems.reduce((sum, li) => sum + li.hours, 0);

  const footerParts = [invoice.senderName];
  const firstAddressLine = invoice.senderAddress?.split("\n")[0];
  if (firstAddressLine) footerParts.push(firstAddressLine);
  if (invoice.vatId) footerParts.push(`Tax No. ${invoice.vatId}`);
  const footerText = footerParts.join(" · ");

  return (
    <Document title={invoice.invoiceNumber} author={invoice.senderName}>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.senderBlock}>
            <Text style={styles.senderName}>{invoice.senderName || "—"}</Text>
            {invoice.senderAddress && (
              <Text style={styles.senderAddress}>{invoice.senderAddress}</Text>
            )}
          </View>
          <View style={styles.invoiceHeadingBlock}>
            <Text style={styles.invoiceHeading}>INVOICE</Text>
            <Text style={styles.invoiceNumberLabel}>No. {invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info: BILLED TO + meta table */}
        <View style={styles.infoSection}>
          <View style={styles.billedToBlock}>
            <Text style={styles.billedToLabel}>Billed To</Text>
            <Text style={styles.clientName}>{invoice.clientName || "—"}</Text>
            {invoice.clientAddress && (
              <Text style={styles.clientAddress}>{invoice.clientAddress}</Text>
            )}
          </View>
          <View style={styles.metaTable}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice Date</Text>
              <Text style={styles.metaValue}>{formatMetaDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{formatMetaDate(invoice.dueDate)}</Text>
            </View>
            {invoice.periodStart !== undefined && invoice.periodEnd !== undefined && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Period</Text>
                <Text style={styles.metaValue}>
                  {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                </Text>
              </View>
            )}
            {invoice.vatId && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Tax No.</Text>
                <Text style={styles.metaValue}>{invoice.vatId}</Text>
              </View>
            )}
            <View style={styles.metaRowLast}>
              <Text style={styles.metaLabel}>Total Due</Text>
              <Text style={styles.metaValueAccent}>{pdfFormatAmount(total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDate}>
              <Text style={styles.thText}>Date</Text>
            </View>
            <View style={styles.colDescription}>
              <Text style={styles.thText}>Description</Text>
            </View>
            <View style={styles.colHours}>
              <Text style={styles.thText}>Hours</Text>
            </View>
            <View style={styles.colRate}>
              <Text style={styles.thText}>Rate ({currency})</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.thText}>Amount ({currency})</Text>
            </View>
          </View>

          {lineItems.map((li, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <View style={styles.colDate}>
                <Text style={styles.tdText}>
                  {li.date ? formatLineItemDate(li.date) : ""}
                </Text>
              </View>
              <View style={styles.colDescription}>
                <Text style={styles.tdText}>{li.description}</Text>
              </View>
              <View style={styles.colHours}>
                <Text style={styles.tdText}>{li.hours.toFixed(2)}</Text>
              </View>
              <View style={styles.colRate}>
                <Text style={styles.tdText}>{pdfFormatAmount(li.rate, currency)}</Text>
              </View>
              <View style={styles.colAmount}>
                <Text style={styles.tdBold}>{pdfFormatAmount(li.amount, currency)}</Text>
              </View>
            </View>
          ))}

          {/* Total row */}
          <View style={styles.tableTotalRow}>
            <View style={styles.colDate}>
              <Text style={styles.tdTotalWhite}> </Text>
            </View>
            <View style={styles.colDescription}>
              <Text style={styles.tdTotalWhiteBold}>TOTAL</Text>
            </View>
            <View style={styles.colHours}>
              <Text style={styles.tdTotalWhite}>{totalHours.toFixed(2)}</Text>
            </View>
            <View style={styles.colRate}>
              <Text style={styles.tdTotalWhite}> </Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.tdTotalWhiteBold}>{pdfFormatAmount(total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom: Payment details + Notes */}
        {(invoice.bankName || invoice.iban || invoice.bic || invoice.notes) && (
          <View style={styles.bottomSection}>
            {(invoice.bankName || invoice.iban || invoice.bic) && (
              <View style={styles.paymentBlock}>
                <Text style={styles.sectionLabel}>Payment Details</Text>
                {invoice.senderName && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentKey}>Account holder:</Text>
                    <Text style={styles.paymentVal}>{invoice.senderName}</Text>
                  </View>
                )}
                {invoice.bankName && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentKey}>Bank:</Text>
                    <Text style={styles.paymentVal}>{invoice.bankName}</Text>
                  </View>
                )}
                {invoice.iban && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentKey}>IBAN:</Text>
                    <Text style={styles.paymentVal}>{invoice.iban}</Text>
                  </View>
                )}
                {invoice.bic && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentKey}>BIC/SWIFT:</Text>
                    <Text style={styles.paymentVal}>{invoice.bic}</Text>
                  </View>
                )}
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentKey}>Reference:</Text>
                  <Text style={styles.paymentVal}>{invoice.invoiceNumber}</Text>
                </View>
              </View>
            )}
            {invoice.notes && (
              <View style={styles.notesBlock}>
                <Text style={styles.sectionLabel}>Note</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{footerText}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function exportInvoicePdf(invoice: InvoicePdfData): Promise<void> {
  const blob = await pdf(<InvoicePdfDocument invoice={invoice} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
