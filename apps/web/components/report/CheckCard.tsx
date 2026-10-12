"use client";

import { useId, useState } from "react";
import { ChevronDown, CircleCheck, CircleDashed, CircleX, CircleAlert, Lightbulb, Sparkles } from "lucide-react";

import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import type { Check } from "@/lib/types";
import { cn } from "@/lib/utils";

type Ns = "web" | "cv";

function status(score: number | null) {
  if (score === null) return "na" as const;
  if (score >= 1) return "pass" as const;
  if (score > 0) return "partial" as const;
  return "fail" as const;
}

const STATUS_STYLE = {
  pass: { icon: CircleCheck, cls: "bg-success-soft text-success" },
  partial: { icon: CircleAlert, cls: "bg-warn-soft text-warn" },
  fail: { icon: CircleX, cls: "bg-danger-soft text-danger" },
  na: { icon: CircleDashed, cls: "bg-surface-2 text-muted" },
} as const;

/** One scored check. Failed checks open with the fix visible; passed ones stay compact. */
export function CheckCard({ check, ns, extra }: { check: Check; ns: Ns; extra?: React.ReactNode }) {
  const { m } = useApp();
  const st = status(check.score);
  const [open, setOpen] = useState(st === "fail" || st === "partial");
  const detailsId = useId();
  const text = (m.checks[ns] as Record<string, { title: string; why: string; fix: string }>)[check.id];
  const { icon: Icon, cls } = STATUS_STYLE[st];
  const label = { pass: m.common.passed, partial: m.common.partial, fail: m.common.failed, na: m.common.notMeasured }[st];

  return (
    <article className={cn(cardClass, "p-5")}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </span>
        {check.method === "ai" ? (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="size-3" aria-hidden="true" />
            {m.common.aiCheck}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 font-semibold">{text?.title ?? check.id}</h3>
      {check.value ? (
        <p className="mt-1 break-words text-sm text-muted">
          {m.common.measured}: <span className="font-mono text-xs">{check.value}</span>
        </p>
      ) : null}
      {check.note ? <p className="mt-2 text-sm">{check.note}</p> : null}

      {/* When the caller shows the line in context (extra), skip the plain quote to avoid repeating it. */}
      {!extra && check.evidence && check.evidence.quote !== "(missing)" ? (
        <figure className="mt-3">
          <figcaption className="break-all text-xs text-muted">
            {m.common.evidence} · <span className="font-mono">{check.evidence.locator}</span>
          </figcaption>
          <blockquote className="mt-1.5 break-words rounded-lg border-l-4 border-border bg-surface-2 px-3 py-2 font-mono text-sm">
            {check.evidence.quote}
          </blockquote>
        </figure>
      ) : null}
      {extra}

      {text ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1 text-sm font-medium text-primary"
          >
            {m.common.seeDetails}
            <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
          </button>
          <div id={detailsId} hidden={!open} className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{m.common.whyItMatters}</p>
              <p className="mt-1 text-muted">{text.why}</p>
            </div>
            {st !== "pass" ? (
              <div className="flex gap-2 rounded-lg bg-primary-soft p-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p>
                  <span className="font-medium">{m.common.howToFix}: </span>
                  {text.fix}
                </p>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </article>
  );
}
