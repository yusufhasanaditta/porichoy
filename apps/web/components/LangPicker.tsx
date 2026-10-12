"use client";

import { useApp } from "@/lib/providers";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Choose the language the AI writes the report in. */
export function LangPicker({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  const { m } = useApp();
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{m.common.lang}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(["en", "bn"] as const).map((l) => (
          <label
            key={l}
            className={cn(
              "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              value === l ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-2",
            )}
          >
            <input type="radio" name="reportLang" value={l} checked={value === l} onChange={() => onChange(l)} className="sr-only" />
            {l === "en" ? m.common.langEn : m.common.langBn}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
