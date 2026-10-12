import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

export function buttonClass(variant: Variant = "primary", extra?: string): string {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
    "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "bg-primary text-primary-fg hover:bg-primary-hover",
    variant === "secondary" && "border border-border bg-surface text-fg hover:bg-surface-2",
    variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-fg",
    extra,
  );
}

export const cardClass = "rounded-2xl border border-border bg-surface shadow-card";

export const inputClass =
  "block min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-fg placeholder:text-muted/70 " +
  "transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-danger";
