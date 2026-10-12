"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { BriefcaseBusiness, FileText, GitCompareArrows, Globe, Info, Plus } from "lucide-react";

import { AgentTrace } from "@/components/AgentTrace";
import { ConsistencyCard } from "@/components/ConsistencyCard";
import { FindingCard } from "@/components/FindingCard";
import { RewriteCard } from "@/components/RewriteCard";
import { ScoreRing, TONE_COLOR, scoreTone } from "@/components/ScoreRing";
import { buttonClass, cardClass } from "@/components/ui";
import { consistencyFlags, findings, rewrites, scores, type Severity } from "@/lib/demo-data";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const TABS = ["findings", "rewrites", "consistency"] as const;
type Tab = (typeof TABS)[number];
type Filter = "all" | Severity;

const SECTION_ICONS = { linkedin: BriefcaseBusiness, website: Globe, cv: FileText, consistency: GitCompareArrows } as const;

export default function DashboardPage() {
  const { m, num } = useApp();
  const t = m.dash;
  const [tab, setTab] = useState<Tab>("findings");
  const [filter, setFilter] = useState<Filter>("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const counts: Record<Tab, number> = {
    findings: findings.length,
    rewrites: rewrites.length,
    consistency: consistencyFlags.length,
  };
  const visibleFindings = filter === "all" ? findings : findings.filter((f) => f.severity === filter);

  // Arrow-key navigation between tabs (WAI-ARIA tabs pattern).
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next] ?? "findings");
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t.demoNote}
          </p>
        </div>
        <Link href="/scan/new" className={buttonClass("secondary", "shrink-0")}>
          <Plus className="size-4" aria-hidden="true" />
          {t.rescan}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column: scores + trace */}
        <aside className="space-y-6">
          <section aria-labelledby="presence" className={cn(cardClass, "p-6")}>
            <h2 id="presence" className="font-semibold">
              {t.presence}
            </h2>
            <div className="mt-4 flex items-center gap-5 lg:flex-col lg:text-center">
              <ScoreRing score={scores.presence} size={140} label={t.presence} display={num(scores.presence)} sublabel={t.outOf} />
              <div>
                <p className="text-lg font-semibold" style={{ color: TONE_COLOR[scoreTone(scores.presence)] }}>
                  {t.rating[scoreTone(scores.presence)]}
                </p>
                <p className="text-sm text-muted">{t.sources}</p>
              </div>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {(["linkedin", "website", "cv", "consistency"] as const).map((key) => {
                const Icon = SECTION_ICONS[key];
                const value = scores[key];
                return (
                  <li key={key} className="rounded-xl border border-border bg-surface-2 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {t.sections[key]}
                    </div>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{num(value)}</p>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
                      role="meter"
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t.sections[key]}
                    >
                      <div className="h-full rounded-full" style={{ width: `${value}%`, background: TONE_COLOR[scoreTone(value)] }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={cn(cardClass, "p-6")}>
            <AgentTrace />
          </section>
        </aside>

        {/* Right column: tabs */}
        <section className="min-w-0">
          <div role="tablist" aria-label={t.title} className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface p-1">
            {TABS.map((key, i) => (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`tab-${key}`}
                role="tab"
                type="button"
                aria-selected={tab === key}
                aria-controls={`panel-${key}`}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-colors duration-200",
                  tab === key ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <span className="truncate">{t.tabs[key]}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    tab === key ? "bg-primary-fg/20" : "bg-surface-2",
                  )}
                >
                  {num(counts[key])}
                </span>
              </button>
            ))}
          </div>

          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-5">
            {tab === "findings" ? (
              <>
                <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t.tabs.findings}>
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
                      {t.severity[f]}
                    </button>
                  ))}
                </div>
                {visibleFindings.length === 0 ? (
                  <p className={cn(cardClass, "p-8 text-center text-muted")}>{t.empty}</p>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {visibleFindings.map((f) => (
                      <FindingCard key={f.id} finding={f} />
                    ))}
                  </div>
                )}
              </>
            ) : null}

            {tab === "rewrites" ? (
              <div className="space-y-4">
                {rewrites.map((r) => (
                  <RewriteCard key={r.id} rewrite={r} />
                ))}
              </div>
            ) : null}

            {tab === "consistency" ? (
              <div className="space-y-4">
                {consistencyFlags.map((c) => (
                  <ConsistencyCard key={c.id} flag={c} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
