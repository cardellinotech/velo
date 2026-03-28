import { BillingSummary } from "@/components/billing/BillingSummary";
import { Receipt } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-y-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Billing</h1>
          <p className="text-sm text-text-secondary mt-1">
            Track and export time by project and client.
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600">
          <Receipt className="w-5 h-5" />
        </div>
      </div>
      <BillingSummary />
    </div>
  );
}
