"use client";

import { useId, useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";

import { SeverityBadge } from "@/components/SeverityBadge";
import { cardClass } from "@/components/ui";
import type { Finding } from "@/lib/demo-data";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const QUOTE_BORDER = { critical: "border-danger", major: "border-warn", minor: "border-muted" } as const;

export function FindingCard({ finding }: { finding: Finding }) {
  const { m, lang } = useApp();
  const [open, setOpen] = useState(finding.severity === "critical");
  const detailsId = useId();

  return (
    <article className={cn(cardClass, "p-5")}>
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <span className="text-xs font-medium text-muted">{m.dash.sections[finding.source]}</span>
      </div>
      <h3 className="mt-3 font-semibold">{finding.problem[lang]}</h3>

      <figure className="mt-3">
        <figcaption className="text-xs font-medium text-muted">
          {m.dash.evidence} · <span className="break-all font-mono">{finding.evidence.locator}</span>
        </figcaption>
        <blockquote
          className={cn(
            "mt-1.5 break-words rounded-lg border-l-4 bg-surface-2 px-3 py-2 font-mono text-sm",
            QUOTE_BORDER[finding.severity],
          )}
        >
          {finding.evidence.quote}
        </blockquote>
      </figure>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1 text-sm font-medium text-primary"
      >
        {open ? m.dash.showLess : m.dash.showMore}
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
      </button>

      <div id={detailsId} hidden={!open} className="space-y-3 text-sm">
        <div>
          <p className="font-medium">{m.dash.whyItHurts}</p>
          <p className="mt-1 text-muted">{finding.whyItHurts[lang]}</p>
        </div>
        <div className="flex gap-2 rounded-lg bg-primary-soft p-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <span className="font-medium">{m.dash.fix}: </span>
            {finding.fixHint[lang]}
          </p>
        </div>
      </div>
    </article>
  );
}
