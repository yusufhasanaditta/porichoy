"use client";

import { ArrowRight } from "lucide-react";

import { SeverityBadge } from "@/components/SeverityBadge";
import { cardClass } from "@/components/ui";
import type { ConsistencyFlag } from "@/lib/demo-data";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function ConsistencyCard({ flag }: { flag: ConsistencyFlag }) {
  const { m, lang } = useApp();

  return (
    <article className={cn(cardClass, "p-5")}>
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={flag.severity} />
        <h3 className="font-semibold">{flag.field[lang]}</h3>
      </div>
      <p className="mt-2 text-sm text-muted">{flag.explanation[lang]}</p>

      <p className="mt-4 text-xs font-medium text-muted">{m.dash.conflict}</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {flag.values.map((v) => (
          <li key={v.source} className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="text-xs font-semibold text-muted">{m.dash.sections[v.source]}</p>
            <p className="mt-1 break-words text-sm font-medium">{v.value}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-muted">{v.locator}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm">
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          <span className="font-medium">{m.dash.suggested}: </span>
          <span className="break-words">{flag.suggested}</span>
        </p>
      </div>
    </article>
  );
}
