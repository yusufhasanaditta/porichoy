"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { JobProgress } from "@/components/report/JobProgress";
import { SectionNav } from "@/components/report/SectionNav";
import { ErrorState, LoadingState } from "@/components/report/StateViews";
import { ScoreRing, TONE_COLOR, scoreTone } from "@/components/ScoreRing";
import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { CvReportProvider } from "@/lib/report-context";
import type { CvResult, Job } from "@/lib/types";
import { useJob } from "@/lib/useJob";
import { cn } from "@/lib/utils";

const improving = (job: Job<CvResult>) => job.result.improve?.status === "running";

export default function CvReportLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { m, num } = useApp();
  const t = m.cv;
  const { job, error, loading, refresh } = useJob<CvResult>(`/v1/cv/${encodeURIComponent(id)}`, improving);

  if (loading && !job) return <LoadingState />;
  if (!job) return <ErrorState message={error?.status === 404 ? m.common.notFound : (error?.message ?? m.common.notFound)} onRetry={refresh} newHref="/cv" />;
  if (job.status === "error") return <ErrorState message={job.error ?? m.common.notFound} newHref="/cv" />;

  const r = job.result;
  const running = job.status === "running";
  const base = `/cv/${id}`;
  const problems = (r.checks ?? []).filter((c) => c.score !== null && c.score < 1).length + (r.findings?.length ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <header className={cn(cardClass, "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6")}>
        {r.overall !== undefined && r.overall !== null ? (
          <ScoreRing score={r.overall} size={112} label={t.title} display={num(r.overall)} sublabel={m.common.outOf} />
        ) : (
          <div className="grid size-28 shrink-0 place-items-center rounded-full border-8 border-surface-2" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted" title={r.fileName}>
            {r.fileName ?? "…"}
          </p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{r.candidateName || t.title}</h1>
          {r.currentTitle || r.targetRole ? (
            <p className="mt-0.5 text-muted">{[r.currentTitle, r.targetRole ? `→ ${r.targetRole}` : null].filter(Boolean).join(" ")}</p>
          ) : null}
          {r.overall !== undefined && r.overall !== null ? (
            <p className="mt-1 font-semibold" style={{ color: TONE_COLOR[scoreTone(r.overall)] }}>
              {m.common.rating[scoreTone(r.overall)]}
            </p>
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
              label={t.title}
              items={[
                { href: base, label: t.sections.overview },
                { href: `${base}/problems`, label: t.sections.problems, badge: problems },
                { href: `${base}/questions`, label: t.sections.questions, badge: r.questions?.length ?? 0 },
                { href: `${base}/improved`, label: t.sections.improved },
              ]}
            />
          </aside>
          <CvReportProvider value={{ job, refresh }}>
            <div className="min-w-0">{children}</div>
          </CvReportProvider>
        </div>
      )}
    </div>
  );
}
