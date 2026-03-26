"use client";

import { cn } from "@/lib/utils";
import { X, CheckCircle, XCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { type Toast, subscribeToToasts, removeToast } from "@/hooks/useToast";

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-emerald-50",
    borderColor: "border-l-emerald-500",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-900",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-l-red-500",
    iconColor: "text-red-600",
    textColor: "text-red-900",
  },
  info: {
    icon: Info,
    bgColor: "bg-slate-50",
    borderColor: "border-l-primary",
    iconColor: "text-primary",
    textColor: "text-text-primary",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = typeConfig[toast.type];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg shadow-elevated px-4 py-3 animate-slide-in",
        "border-l-4 min-w-72 max-w-sm",
        bgColor,
        borderColor
      )}
      role="alert"
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
      <p className={cn("flex-1 text-sm", textColor)}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
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
