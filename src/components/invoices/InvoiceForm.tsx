"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { formatAmount } from "@/lib/currency";
import { formatDate } from "@/lib/formatTime";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, FileDown } from "lucide-react";
import Link from "next/link";
import { exportInvoicePdf } from "@/components/invoices/InvoicePdfExport";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface LineItem {
  date?: number;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  _id: Id<"invoices">;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  issueDate: number;
  dueDate: number;
  clientName: string;
  clientAddress?: string;
  senderName: string;
  senderAddress?: string;
  vatId?: string;
  taxRate?: number;
  bankName?: string;
  iban?: string;
  bic?: string;
  paymentTermDays?: number;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount?: number;
  total: number;
  notes?: string;
  periodStart: number;
  periodEnd: number;
  projectName: string | null;
}

const STATUS_BADGE: Record<InvoiceStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const style = STATUS_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        style.bg,
        style.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function tsToDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateStrToTs(s: string): number {
  return new Date(s + "T00:00:00").getTime();
}

function formatPeriodRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[s.getMonth()]} ${String(s.getDate()).padStart(2, "0")} – ${months[e.getMonth()]} ${String(e.getDate()).padStart(2, "0")}, ${e.getFullYear()}`;
}

interface InvoiceFormProps {
  invoice: InvoiceData;
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const updateInvoice = useMutation(api.invoices.update);
  const updateStatus = useMutation(api.invoices.updateStatus);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);

  const isDraft = invoice.status === "draft";

  // Editable fields (only relevant in draft mode)
  const [senderName, setSenderName] = useState(invoice.senderName);
  const [senderAddress, setSenderAddress] = useState(invoice.senderAddress ?? "");
  const [clientName, setClientName] = useState(invoice.clientName);
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress ?? "");
  const [notes, setNotes] = useState(invoice.notes ?? "");
  const [periodStart, setPeriodStart] = useState(invoice.periodStart);
  const [periodEnd, setPeriodEnd] = useState(invoice.periodEnd);
  const [paymentTermDays, setPaymentTermDays] = useState(invoice.paymentTermDays ?? 14);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingSent, setIsMarkingSent] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isMarkingOverdue, setIsMarkingOverdue] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Keep form in sync if invoice data changes
  useEffect(() => {
    setSenderName(invoice.senderName);
    setSenderAddress(invoice.senderAddress ?? "");
    setClientName(invoice.clientName);
    setClientAddress(invoice.clientAddress ?? "");
    setNotes(invoice.notes ?? "");
    setPeriodStart(invoice.periodStart);
    setPeriodEnd(invoice.periodEnd);
    setPaymentTermDays(invoice.paymentTermDays ?? 14);
  }, [invoice._id]);

  const currency = invoice.currency;
  const subtotal = invoice.subtotal;
  const taxAmount = invoice.taxAmount;
  const total = invoice.total;

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateInvoice({
        invoiceId: invoice._id,
        senderName,
        senderAddress: senderAddress || undefined,
        clientName,
        clientAddress: clientAddress || undefined,
        notes: notes || undefined,
        periodStart,
        periodEnd,
        paymentTermDays,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkSent() {
    setIsMarkingSent(true);
    try {
      await updateStatus({ invoiceId: invoice._id, status: "sent" });
    } finally {
      setIsMarkingSent(false);
    }
  }

  async function handleMarkPaid() {
    setIsMarkingPaid(true);
    try {
      await updateStatus({ invoiceId: invoice._id, status: "paid" });
    } finally {
      setIsMarkingPaid(false);
    }
  }

  async function handleMarkOverdue() {
    setIsMarkingOverdue(true);
    try {
      await updateStatus({ invoiceId: invoice._id, status: "overdue" });
    } finally {
      setIsMarkingOverdue(false);
    }
  }

  const isSentAndPastDue = invoice.status === "sent" && invoice.dueDate < Date.now();

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      await exportInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        paymentTermDays: invoice.paymentTermDays,
        currency: invoice.currency,
        clientName: invoice.clientName,
        clientAddress: invoice.clientAddress,
        senderName: invoice.senderName,
        senderAddress: invoice.senderAddress,
        vatId: invoice.vatId,
        taxRate: invoice.taxRate,
        bankName: invoice.bankName,
        iban: invoice.iban,
        bic: invoice.bic,
        lineItems: invoice.lineItems,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        notes: invoice.notes,
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteInvoice({ invoiceId: invoice._id });
      router.push("/invoices");
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/invoices" className="flex items-center gap-1 hover:text-text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Invoices
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-mono text-text-secondary">{invoice.invoiceNumber}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono text-text-primary tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
            <span>Issued {formatDate(invoice.issueDate)}</span>
            <span className="text-border">·</span>
            <span className={cn(
              "font-medium",
              invoice.status === "overdue" ? "text-red-600" : "text-text-secondary"
            )}>
              Due {formatDate(invoice.dueDate)}
            </span>
            {invoice.projectName && (
              <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface text-text-secondary text-[11px] font-medium border border-border/40">
                  {invoice.projectName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sender + Recipient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sender */}
        <div className="rounded-xl border border-border/60 bg-white p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">From</p>
          {isDraft ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Business name</label>
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your business name"
                  className="h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Address</label>
                <textarea
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="Your address"
                  rows={3}
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 resize-none"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-text-primary">{invoice.senderName || "—"}</p>
              {invoice.senderAddress && (
                <p className="text-xs text-text-secondary whitespace-pre-line">{invoice.senderAddress}</p>
              )}
              {invoice.vatId && (
                <p className="text-xs text-text-muted mt-1">VAT: {invoice.vatId}</p>
              )}
            </div>
          )}
        </div>

        {/* Recipient */}
        <div className="rounded-xl border border-border/60 bg-white p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Bill to</p>
          {isDraft ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Client name</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                  className="h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-primary">Address</label>
                <textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Client billing address"
                  rows={3}
                  className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 resize-none"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-text-primary">{invoice.clientName || "—"}</p>
              {invoice.clientAddress && (
                <p className="text-xs text-text-secondary whitespace-pre-line">{invoice.clientAddress}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Period & Payment Term */}
      <div className="rounded-xl border border-border/60 bg-white p-5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Period &amp; Payment
        </p>
        {isDraft ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Period start</label>
              <input
                type="date"
                value={tsToDateStr(periodStart)}
                onChange={(e) => e.target.value && setPeriodStart(dateStrToTs(e.target.value))}
                className="h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Period end</label>
              <input
                type="date"
                value={tsToDateStr(periodEnd)}
                onChange={(e) => e.target.value && setPeriodEnd(dateStrToTs(e.target.value))}
                className="h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-primary">Payment term</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(Number(e.target.value) || 14)}
                  className="h-9 w-full rounded-lg border border-border/60 bg-white px-3 pr-12 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  days
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2">
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">Period</p>
              <p className="text-sm text-text-primary">
                {formatPeriodRange(invoice.periodStart, invoice.periodEnd)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">Payment terms</p>
              <p className="text-sm text-text-primary">{invoice.paymentTermDays ?? 30} days</p>
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">Due date</p>
              <p className="text-sm text-text-primary">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="rounded-xl border border-border/60 bg-white overflow-hidden min-w-[560px]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-surface">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wide">Line items</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary w-32">Date</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-text-secondary">Description</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary w-24">Hours</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary w-28">
                Rate ({currency})
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li, i) => (
              <tr key={i} className="border-b border-border/20 last:border-0">
                <td className="px-4 py-3 text-sm text-text-secondary font-mono">
                  {li.date ? new Date(li.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                </td>
                <td className="px-5 py-3 text-sm text-text-primary">{li.description}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">
                  {li.hours.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary">
                  {formatAmount(li.rate, currency)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-text-primary font-semibold">
                  {formatAmount(li.amount, currency)}
                </td>
              </tr>
            ))}
            {invoice.lineItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-text-muted">
                  No time entries found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-border/50 bg-surface">
          <div className="flex flex-col gap-1 px-5 py-4 ml-auto max-w-xs">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-mono font-medium text-text-primary">{formatAmount(subtotal, currency)}</span>
            </div>
            {invoice.taxRate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Tax ({invoice.taxRate}%)</span>
                <span className="font-mono font-medium text-text-primary">
                  {formatAmount(taxAmount ?? 0, currency)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
              <span className="text-sm font-bold text-text-primary">Total</span>
              <span className="font-mono text-base font-bold text-text-primary">
                {formatAmount(total, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Payment details */}
      {(invoice.bankName || invoice.iban || invoice.bic) && (
        <div className="rounded-xl border border-border/60 bg-white p-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
            Payment details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {invoice.bankName && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">Bank</p>
                <p className="text-sm text-text-primary">{invoice.bankName}</p>
              </div>
            )}
            {invoice.iban && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">IBAN</p>
                <p className="text-sm font-mono text-text-primary">{invoice.iban}</p>
              </div>
            )}
            {invoice.bic && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">BIC</p>
                <p className="text-sm font-mono text-text-primary">{invoice.bic}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="rounded-xl border border-border/60 bg-white p-5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Notes</p>
        {isDraft ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes or remarks…"
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 resize-none"
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-line">
            {invoice.notes || <span className="text-text-muted italic">No notes</span>}
          </p>
        )}
      </div>

      {saveError && (
        <p className="text-xs text-error bg-error-bg px-3 py-2 rounded-lg">{saveError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pb-6">
        {invoice.status === "draft" && (
          <>
            <Button variant="primary" size="md" onClick={handleSave} loading={isSaving}>
              Save
            </Button>
            <Button variant="secondary" size="md" onClick={handleMarkSent} loading={isMarkingSent}>
              Mark as Sent
            </Button>
            <Button variant="secondary" size="md" onClick={handleExportPdf} loading={isExportingPdf}>
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
            <div className="ml-auto">
              <Button
                variant="destructive"
                size="md"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          </>
        )}

        {invoice.status === "sent" && (
          <>
            <Button variant="primary" size="md" onClick={handleMarkPaid} loading={isMarkingPaid}>
              Mark as Paid
            </Button>
            {isSentAndPastDue && (
              <Button variant="secondary" size="md" onClick={handleMarkOverdue} loading={isMarkingOverdue}>
                Mark as Overdue
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={handleExportPdf} loading={isExportingPdf}>
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
          </>
        )}

        {(invoice.status === "paid" || invoice.status === "overdue") && (
          <Button variant="secondary" size="md" onClick={handleExportPdf} loading={isExportingPdf}>
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete invoice"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete invoice{" "}
            <span className="font-mono font-semibold text-text-primary">
              {invoice.invoiceNumber}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Delete invoice
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
