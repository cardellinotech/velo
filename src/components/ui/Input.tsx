import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border border-border/60 bg-white px-3.5 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-150",
            "hover:border-slate-300",
            error && "border-error focus:ring-error/30 focus:border-error",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
