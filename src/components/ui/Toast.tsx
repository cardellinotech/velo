"use client";

import { cn } from "@/lib/utils";
import { X, CheckCircle, XCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { type Toast, subscribeToToasts, removeToast } from "@/hooks/useToast";

const typeConfig = {
  success: {
    icon: CheckCircle,
    borderColor: "border-l-success",
    iconColor: "text-success",
  },
  error: {
    icon: XCircle,
    borderColor: "border-l-error",
    iconColor: "text-error",
  },
  info: {
    icon: Info,
    borderColor: "border-l-primary",
    iconColor: "text-primary",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { icon: Icon, borderColor, iconColor } = typeConfig[toast.type];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-border bg-white shadow-card-hover px-4 py-3",
        "border-l-4 min-w-72 max-w-sm",
        borderColor
      )}
      role="alert"
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return subscribeToToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
