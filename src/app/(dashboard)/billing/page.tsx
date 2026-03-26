import { BillingSummary } from "@/components/billing/BillingSummary";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Billing</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Track and export time by project and client.
        </p>
      </div>
      <BillingSummary />
    </div>
  );
}
