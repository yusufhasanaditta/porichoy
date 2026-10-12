"use client";

import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

import { SeverityBadge } from "@/components/SeverityBadge";
import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import type { Finding } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUOTE_BORDER = { critical: "border-danger", major: "border-warn", minor: "border-muted" } as const;

/** AI finding. `context` replaces the plain quote, e.g. with surrounding CV lines. */
export function FindingCard({ finding, context }: { finding: Finding; context?: ReactNode }) {
  const { m } = useApp();
  return (
    <article className={cn(cardClass, "p-5")}>
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        {finding.section ? <span className="text-xs font-medium text-muted">{finding.section}</span> : null}
      </div>
      <h3 className="mt-3 font-semibold">{finding.problem}</h3>
      <figure className="mt-3">
        <figcaption className="break-all text-xs text-muted">
          {m.common.evidence} · <span className="font-mono">{finding.evidence.locator}</span>
        </figcaption>
        {context ?? (
          <blockquote className={cn("mt-1.5 break-words rounded-lg border-l-4 bg-surface-2 px-3 py-2 font-mono text-sm", QUOTE_BORDER[finding.severity])}>
            {finding.evidence.quote}
          </blockquote>
        )}
      </figure>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <p className="font-medium">{m.common.whyItMatters}</p>
          <p className="mt-1 text-muted">{finding.whyItHurts}</p>
        </div>
        <div className="flex gap-2 rounded-lg bg-primary-soft p-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            <span className="font-medium">{m.common.howToFix}: </span>
            {finding.fixHint}
          </p>
        </div>
      </div>
    </article>
  );
}
