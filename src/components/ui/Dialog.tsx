"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  fullScreenMobile?: boolean;
}

export function Dialog({ open, onClose, title, children, className, noPadding, fullScreenMobile }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex justify-center",
        fullScreenMobile ? "items-end sm:items-center" : "items-end sm:items-center"
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" onClick={onClose} />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={cn(
          "relative z-10 w-full bg-white shadow-modal animate-scale-in",
          "border border-border/60 flex flex-col",
          fullScreenMobile
            ? "rounded-none h-full sm:rounded-2xl sm:max-w-md sm:mx-4 sm:h-auto sm:max-h-[90vh]"
            : "rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 max-h-[90vh]",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 shrink-0">
            <h2 id="dialog-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-11 h-11 sm:w-7 sm:h-7 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-all duration-150"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={cn("flex-1 overflow-y-auto", !noPadding && "p-5")}>{children}</div>
      </div>
    </div>
  );
}
