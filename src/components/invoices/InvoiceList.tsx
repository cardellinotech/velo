"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatAmount } from "@/lib/currency";
import { formatDate } from "@/lib/formatTime";
import { cn } from "@/lib/utils";
import { FileText, ArrowRight, Send, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const STATUS_BADGE: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
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

function OverdueBadge({ daysOverdue }: { daysOverdue: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600">
      <AlertCircle className="w-3 h-3" />
      {daysOverdue}d overdue
    </span>
  );
}

interface InvoiceRowProps {
  invoice: {
    _id: Id<"invoices">;
    invoiceNumber: string;
    clientName: string;
    projectName?: string | null;
    issueDate: number;
    dueDate: number;
    total: number;
    currency: string;
    status: string;
  };
}

function InvoiceRow({ invoice }: InvoiceRowProps) {
  const router = useRouter();
  const updateStatus = useMutation(api.invoices.updateStatus);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);
  const [isActing, setIsActing] = useState(false);

  const now = Date.now();
  const isEffectivelyOverdue =
    invoice.status === "sent" && invoice.dueDate < now;
  const daysOverdue = isEffectivelyOverdue
    ? Math.floor((now - invoice.dueDate) / (24 * 60 * 60 * 1000))
    : 0;

  async function handleMarkPaid(e: React.MouseEvent) {
    e.stopPropagation();
    setIsActing(true);
    try {
      await updateStatus({ invoiceId: invoice._id, status: "paid" });
    } finally {
      setIsActing(false);
    }
  }

  async function handleMarkSent(e: React.MouseEvent) {
    e.stopPropagation();
    setIsActing(true);
    try {
      await updateStatus({ invoiceId: invoice._id, status: "sent" });
    } finally {
      setIsActing(false);
    }
  }

  async function handleMarkOverdue(e: React.MouseEvent) {
    e.stopPropagation();
    setIsActing(true);
    try {
      await updateStatus({ invoiceId: invoice._id, status: "overdue" });
    } finally {
      setIsActing(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this draft invoice? This cannot be undone.")) return;
    setIsActing(true);
    try {
      await deleteInvoice({ invoiceId: invoice._id });
    } finally {
      setIsActing(false);
    }
  }

  return (
    <button
      onClick={() => router.push(`/invoices/${invoice._id}`)}
      className="group flex items-center gap-4 rounded-xl border border-border/60 bg-white px-5 py-4 text-left shadow-card hover:shadow-card-hover hover:border-border transition-all duration-200 hover:-translate-y-px w-full"
    >
      {/* Invoice number */}
      <span className="font-mono text-sm font-semibold text-text-primary shrink-0 w-32">
        {invoice.invoiceNumber}
      </span>

      {/* Client + project */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {invoice.clientName}
        </p>
        {invoice.projectName && (
          <p className="text-xs text-text-muted mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface text-text-secondary text-[11px] font-medium">
              {invoice.projectName}
            </span>
          </p>
        )}
      </div>

      {/* Overdue indicator */}
      {isEffectivelyOverdue && (
        <OverdueBadge daysOverdue={daysOverdue} />
      )}

      {/* Date */}
      <span className="text-xs text-text-secondary shrink-0 hidden sm:block">
        {formatDate(invoice.issueDate)}
      </span>

      {/* Amount */}
      <span className="font-mono text-sm font-semibold text-text-primary shrink-0">
        {formatAmount(invoice.total, invoice.currency)}
      </span>

      {/* Status badge */}
      <StatusBadge status={invoice.status} />

      {/* Quick actions (show on hover) */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {invoice.status === "draft" && (
          <>
            <button
              onClick={handleMarkSent}
              disabled={isActing}
              title="Mark as Sent"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
            <button
              onClick={handleDelete}
              disabled={isActing}
              title="Delete draft"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
        {invoice.status === "sent" && (
          <>
            <button
              onClick={handleMarkPaid}
              disabled={isActing}
              title="Mark as Paid"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              Paid
            </button>
            {isEffectivelyOverdue && (
              <button
                onClick={handleMarkOverdue}
                disabled={isActing}
                title="Mark as Overdue"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <AlertCircle className="w-3 h-3" />
                Overdue
              </button>
            )}
          </>
        )}
        {invoice.status === "overdue" && (
          <button
            onClick={handleMarkPaid}
            disabled={isActing}
            title="Mark as Paid"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3" />
            Paid
          </button>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

export function InvoiceList() {
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");

  const invoices = useQuery(api.invoices.list, {
    status: activeTab !== "all" ? activeTab : undefined,
  });

  const isLoading = invoices === undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border/40 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
              activeTab === tab.value
                ? "bg-gradient-primary text-white shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-4 w-28 bg-surface rounded" />
                <div className="h-4 w-32 bg-surface rounded" />
                <div className="h-4 w-20 bg-surface rounded ml-auto" />
                <div className="h-6 w-16 bg-surface rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-surface py-16">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500">
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">No invoices yet</p>
            <p className="text-sm text-text-secondary mt-1">
              {activeTab !== "all" ? (
                <>No {activeTab} invoices.</>
              ) : (
                <>
                  Create one from the{" "}
                  <Link href="/billing" className="text-primary underline underline-offset-2 hover:opacity-80">
                    Billing page
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice._id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
}
