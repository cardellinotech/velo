"use client";

import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your business details, invoice defaults, and preferences.
        </p>
      </div>
      <BusinessSettingsForm />
    </div>
  );
}
