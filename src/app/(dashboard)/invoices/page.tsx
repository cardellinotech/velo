import { InvoiceList } from "@/components/invoices/InvoiceList";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Invoices</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage and track your client invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-gradient-primary text-white hover:opacity-90 shadow-xs transition-all duration-150"
          >
            <FileText className="w-4 h-4" />
            New Invoice
          </Link>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>
      <InvoiceList />
    </div>
  );
}
