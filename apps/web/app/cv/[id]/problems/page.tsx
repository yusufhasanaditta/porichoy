"use client";

import { useState } from "react";

import { CheckCard } from "@/components/report/CheckCard";
import { CvLines } from "@/components/report/CvLines";
import { FindingCard } from "@/components/report/FindingCard";
import { AiOffNotice } from "@/components/report/StateViews";
import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { useCvReport } from "@/lib/report-context";
import type { Check, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | Severity;

function lineOf(check: Check): number | null {
  const match = check.evidence?.locator.match(/^cv:line:(\d+)$/);
  return match ? Number(match[1]) : null;
}

export default function CvProblemsPage() {
  const { m } = useApp();
  const t = m.cv;
  const { job } = useCvReport();
  const r = job.result;
  const lines = r.lines ?? [];
  const [filter, setFilter] = useState<Filter>("all");

  const failed = (r.checks ?? []).filter((c) => c.score !== null && c.score < 1).sort((a, b) => b.weight - a.weight);
  const passed = (r.checks ?? []).filter((c) => c.score !== null && c.score >= 1);
  const findings = (r.findings ?? []).filter((f) => filter === "all" || f.severity === filter);

  const withLines = (c: Check) => {
    const n = lineOf(c);
    return n !== null ? <CvLines lines={lines} target={n} quote={c.evidence?.quote} /> : undefined;
  };

  return (
    <div className="space-y-8">
      {!r.aiAvailable ? <AiOffNotice /> : null}

      {r.aiAvailable ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">{t.aiProblems}</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.aiProblems}>
              {(["all", "critical", "major", "minor"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "min-h-9 cursor-pointer rounded-full border px-3 text-sm font-medium transition-colors duration-200",
                    filter === f ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:text-fg",
                  )}
                >
                  {m.common.severity[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {findings.map((f, i) => (
              <FindingCard
                key={i}
                finding={f}
                context={f.evidence.line ? <CvLines lines={lines} target={f.evidence.line} quote={f.evidence.quote} /> : undefined}
              />
            ))}
            {!findings.length ? <p className={cn(cardClass, "p-6 text-center text-muted xl:col-span-2")}>{m.common.allGood}</p> : null}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-xl font-bold tracking-tight">
          {m.common.toFix} <span className="text-muted tabular-nums">({failed.length})</span>
        </h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {failed.map((c) => (
            <CheckCard key={c.id} check={c} ns="cv" extra={withLines(c)} />
          ))}
          {!failed.length ? <p className={cn(cardClass, "p-6 text-center text-muted xl:col-span-2")}>{m.common.allGood}</p> : null}
        </div>
      </section>

      {passed.length ? (
        <section>
          <h2 className="text-xl font-bold tracking-tight">
            {m.common.done} <span className="text-muted tabular-nums">({passed.length})</span>
          </h2>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {passed.map((c) => (
              <CheckCard key={c.id} check={c} ns="cv" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
