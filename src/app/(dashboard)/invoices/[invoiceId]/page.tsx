"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = use(params);
  const invoice = useQuery(api.invoices.get, {
    invoiceId: invoiceId as Id<"invoices">,
  });

  if (invoice === undefined) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/invoices" className="flex items-center gap-1 hover:text-text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Invoices
          </Link>
        </div>
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-8 w-48 bg-surface rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-40 bg-surface rounded-xl" />
            <div className="h-40 bg-surface rounded-xl" />
          </div>
          <div className="h-64 bg-surface rounded-xl" />
        </div>
      </div>
    );
  }

  if (invoice === null) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <Link href="/invoices" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Invoices
        </Link>
        <p className="text-sm text-text-secondary">Invoice not found.</p>
      </div>
    );
  }

  return <InvoiceForm invoice={invoice} />;
}
