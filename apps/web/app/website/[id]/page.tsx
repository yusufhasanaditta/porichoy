"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, FileText, Sparkles } from "lucide-react";

import { JobProgress } from "@/components/report/JobProgress";
import { ScoreTile } from "@/components/report/ScoreTile";
import { AiOffNotice } from "@/components/report/StateViews";
import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { useWebsiteReport } from "@/lib/report-context";
import { WEB_SECTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function WebsiteOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { m } = useApp();
  const t = m.website;
  const { job } = useWebsiteReport();
  const r = job.result;
  const checks = r.checks ?? [];
  const top = checks
    .filter((c) => c.score !== null && c.score < 1)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {!r.aiAvailable ? <AiOffNotice /> : null}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {WEB_SECTIONS.map((s) => (
          <li key={s}>
            <ScoreTile label={t.sections[s]} score={r.sections?.[s] ?? null} href={`/website/${id}/${s}`} />
          </li>
        ))}
      </ul>

      {r.contentOverall ? (
        <section className={cn(cardClass, "p-5 sm:p-6")}>
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {t.aiSummary}
          </h2>
          <p className="mt-2 text-muted">{r.contentOverall}</p>
        </section>
      ) : null}

      {top.length ? (
        <section className={cn(cardClass, "p-5 sm:p-6")}>
          <h2 className="font-semibold">{t.topIssues}</h2>
          <ul className="mt-3 divide-y divide-border">
            {top.map((c) => {
              const text = (m.checks.web as Record<string, { title: string; fix: string }>)[c.id];
              return (
                <li key={c.id}>
                  <Link
                    href={`/website/${id}/${c.section}`}
                    className="group flex min-h-14 items-center justify-between gap-3 py-3 transition-colors duration-200"
                  >
                    <div className="min-w-0">
                      <p className="font-medium group-hover:text-primary">{text?.title ?? c.id}</p>
                      <p className="mt-0.5 text-sm text-muted">{text?.fix}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                      {t.sections[c.section as keyof typeof t.sections]}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className={cn(cardClass, "p-5 sm:p-6")}>
          <h2 className="font-semibold">{t.pagesChecked}</h2>
          <ul className="mt-3 space-y-2">
            {(r.pages ?? []).map((p) => (
              <li key={p.url} className="flex gap-2 text-sm">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-medium" title={p.title ?? undefined}>
                    {p.title || "—"}
                  </p>
                  <p className="break-all font-mono text-xs text-muted">{p.url}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className={cn(cardClass, "p-5 sm:p-6")}>
          <h2 className="font-semibold">{m.common.progress}</h2>
          <div className="mt-3">
            <JobProgress steps={job.steps} labels={t.steps} running={false} />
          </div>
        </section>
      </div>
    </div>
  );
}
