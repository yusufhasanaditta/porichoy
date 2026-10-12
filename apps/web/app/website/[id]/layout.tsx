"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { JobProgress } from "@/components/report/JobProgress";
import { SectionNav } from "@/components/report/SectionNav";
import { ErrorState, LoadingState } from "@/components/report/StateViews";
import { ScoreRing, TONE_COLOR, scoreTone } from "@/components/ScoreRing";
import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { WebsiteReportProvider } from "@/lib/report-context";
import { WEB_SECTIONS, type WebsiteResult } from "@/lib/types";
import { useJob } from "@/lib/useJob";
import { cn } from "@/lib/utils";

export default function WebsiteReportLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { m, num } = useApp();
  const t = m.website;
  const { job, error, loading, refresh } = useJob<WebsiteResult>(`/v1/website/${encodeURIComponent(id)}`);

  if (loading && !job) return <LoadingState />;
  if (!job) return <ErrorState message={error?.status === 404 ? m.common.notFound : (error?.message ?? m.common.notFound)} onRetry={refresh} newHref="/website" />;
  if (job.status === "error") return <ErrorState message={job.error ?? m.common.notFound} newHref="/website" />;

  const r = job.result;
  const running = job.status === "running";
  const base = `/website/${id}`;
  const failCount = (section: string) => (r.checks ?? []).filter((c) => c.section === section && c.score !== null && c.score < 1).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <header className={cn(cardClass, "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6")}>
        {r.overall !== undefined && r.overall !== null ? (
          <ScoreRing score={r.overall} size={112} label={t.reportTitle} display={num(r.overall)} sublabel={m.common.outOf} />
        ) : (
          <div className="grid size-28 shrink-0 place-items-center rounded-full border-8 border-surface-2" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{t.reportTitle}</p>
          <h1 className="mt-1 break-all text-xl font-bold sm:text-2xl">{(r.finalUrl ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "") || "…"}</h1>
          {r.overall !== undefined && r.overall !== null ? (
            <p className="mt-1 font-semibold" style={{ color: TONE_COLOR[scoreTone(r.overall)] }}>
              {m.common.rating[scoreTone(r.overall)]}
            </p>
          ) : null}
          {r.finalUrl ? (
            <a href={r.finalUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary">
              {r.finalUrl}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </header>

      {running ? (
        <section className={cn(cardClass, "mt-6 p-5 sm:p-6")} aria-label={m.common.progress}>
          <JobProgress steps={job.steps} labels={t.steps} running />
        </section>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SectionNav
              label={t.reportTitle}
              items={[
                { href: base, label: t.sections.overview },
                ...WEB_SECTIONS.map((s) => ({ href: `${base}/${s}`, label: t.sections[s], badge: failCount(s) })),
              ]}
            />
          </aside>
          <WebsiteReportProvider value={{ job, refresh }}>
            <div className="min-w-0">{children}</div>
          </WebsiteReportProvider>
        </div>
      )}
    </div>
  );
}
