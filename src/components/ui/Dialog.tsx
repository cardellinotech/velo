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
}

export function Dialog({ open, onClose, title, children, className, noPadding }: DialogProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[6px]" onClick={onClose} />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl bg-white shadow-modal mx-4 animate-scale-in",
          "border border-border/60 flex flex-col max-h-[90vh]",
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
              className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-all duration-150"
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
