"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";

function SectionCard({
  title,
  gradient,
  children,
}: {
  title: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white rounded-xl border border-border/60 overflow-hidden shadow-card">
      <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r", gradient)} />
      <div className="px-6 pt-6 pb-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">{title}</h2>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-text-primary">{children}</label>
  );
}

export function BusinessSettingsForm() {
  const toast = useToast();
  const settings = useQuery(api.userSettings.get);
  const upsert = useMutation(api.userSettings.upsert);

  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [vatId, setVatId] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [paymentTermDays, setPaymentTermDays] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("RE");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setDefaultCurrency(settings.defaultCurrency ?? "EUR");
      setBusinessName(settings.businessName ?? "");
      setBusinessAddress(settings.businessAddress ?? "");
      setVatId(settings.vatId ?? "");
      setTaxRate(settings.taxRate?.toString() ?? "");
      setBankName(settings.bankName ?? "");
      setIban(settings.iban ?? "");
      setBic(settings.bic ?? "");
      setPaymentTermDays(settings.paymentTermDays?.toString() ?? "");
      setInvoicePrefix(settings.invoicePrefix ?? "RE");
      setNextInvoiceNumber(settings.nextInvoiceNumber?.toString() ?? "1");
      setInitialized(true);
    }
  }, [settings, initialized]);

  // Live preview of invoice number format
  const year = new Date().getFullYear();
  const previewNumber = parseInt(nextInvoiceNumber || "1", 10);
  const invoicePreview = `${invoicePrefix || "RE"}-${year}-${String(previewNumber).padStart(3, "0")}`;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert({
        defaultCurrency,
        businessName: businessName.trim() || undefined,
        businessAddress: businessAddress.trim() || undefined,
        vatId: vatId.trim() || undefined,
        taxRate: taxRate.trim() ? parseFloat(taxRate) : undefined,
        bankName: bankName.trim() || undefined,
        iban: iban.trim() || undefined,
        bic: bic.trim() || undefined,
        paymentTermDays: paymentTermDays.trim() ? parseInt(paymentTermDays, 10) : undefined,
        invoicePrefix: invoicePrefix.trim() || undefined,
        nextInvoiceNumber: parseInt(nextInvoiceNumber || "1", 10),
      });
      toast.success("Settings saved.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (settings === undefined) {
    return (
      <div className="flex flex-col gap-5 max-w-xl animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 overflow-hidden">
            <div className="h-[3px] bg-surface" />
            <div className="px-6 pt-6 pb-5 space-y-3">
              <div className="h-4 w-24 bg-surface rounded" />
              <div className="h-9 bg-surface rounded-lg" />
              <div className="h-9 bg-surface rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-xl">
      <SectionCard title="General" gradient="from-indigo-500 to-violet-500">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Default currency</FieldLabel>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            className={cn(
              "h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "hover:border-slate-300 transition-all duration-150"
            )}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Business Details" gradient="from-blue-500 to-cyan-500">
        <Input
          label="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Acme Freelance GmbH"
        />
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Business address</FieldLabel>
          <textarea
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            placeholder={"Musterstraße 1\n12345 Berlin\nGermany"}
            rows={3}
            className={cn(
              "w-full rounded-lg border border-border/60 bg-white px-3.5 py-2.5 text-sm text-text-primary",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "hover:border-slate-300 transition-all duration-150 resize-none"
            )}
          />
        </div>
        <Input
          label="VAT ID (USt-IdNr.)"
          value={vatId}
          onChange={(e) => setVatId(e.target.value)}
          placeholder="e.g. DE123456789"
        />
      </SectionCard>

      <SectionCard title="Tax" gradient="from-amber-500 to-orange-500">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Default tax rate</FieldLabel>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="e.g. 19"
              className={cn(
                "h-9 w-full rounded-lg border border-border/60 bg-white pl-3.5 pr-10 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                "hover:border-slate-300 transition-all duration-150"
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
              %
            </span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Payment Details" gradient="from-emerald-500 to-teal-500">
        <Input
          label="Bank name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g. Deutsche Bank"
        />
        <Input
          label="IBAN"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="e.g. DE89 3704 0044 0532 0130 00"
        />
        <Input
          label="BIC / SWIFT"
          value={bic}
          onChange={(e) => setBic(e.target.value)}
          placeholder="e.g. DEUTDEDB"
        />
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Payment term (days)</FieldLabel>
          <input
            type="number"
            min="0"
            step="1"
            value={paymentTermDays}
            onChange={(e) => setPaymentTermDays(e.target.value)}
            placeholder="e.g. 14"
            className={cn(
              "h-9 w-full rounded-lg border border-border/60 bg-white px-3.5 text-sm text-text-primary",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "hover:border-slate-300 transition-all duration-150"
            )}
          />
        </div>
      </SectionCard>

      <SectionCard title="Invoice Numbering" gradient="from-violet-500 to-purple-500">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Prefix"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
            placeholder="e.g. RE"
          />
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Next number</FieldLabel>
            <input
              type="number"
              min="1"
              step="1"
              value={nextInvoiceNumber}
              onChange={(e) => setNextInvoiceNumber(e.target.value)}
              placeholder="1"
              className={cn(
                "h-9 w-full rounded-lg border border-border/60 bg-white px-3.5 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                "hover:border-slate-300 transition-all duration-150"
              )}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface px-3.5 py-2.5 border border-border/50">
          <span className="text-xs text-text-secondary">Preview:</span>
          <span className="text-sm font-mono font-medium text-text-primary">{invoicePreview}</span>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
