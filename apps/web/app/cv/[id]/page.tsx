"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, MessageCircleQuestion, Sparkles, Trash2 } from "lucide-react";

import { JobProgress } from "@/components/report/JobProgress";
import { ScoreTile } from "@/components/report/ScoreTile";
import { AiOffNotice } from "@/components/report/StateViews";
import { buttonClass, cardClass } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { useCvReport } from "@/lib/report-context";
import { CV_SECTIONS } from "@/lib/types";
import { cn, fill } from "@/lib/utils";

export default function CvOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { m, num } = useApp();
  const t = m.cv;
  const { job } = useCvReport();
  const r = job.result;
  const [deleting, setDeleting] = useState(false);
  const problems = (r.checks ?? []).filter((c) => c.score !== null && c.score < 1).length + (r.findings?.length ?? 0);
  const questions = r.questions?.length ?? 0;

  async function onDelete() {
    if (!window.confirm(m.common.delete + "?")) return;
    setDeleting(true);
    try {
      await api(`/v1/cv/${id}`, { method: "DELETE" });
    } finally {
      router.push("/cv");
    }
  }

  return (
    <div className="space-y-6">
      {!r.aiAvailable ? <AiOffNotice /> : null}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CV_SECTIONS.map((s) => (
          <li key={s}>
            <ScoreTile label={t.scoreSections[s]} score={r.sections?.[s] ?? null} href={`/cv/${id}/problems`} />
          </li>
        ))}
      </ul>

      {r.summary ? (
        <section className={cn(cardClass, "p-5 sm:p-6")}>
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {t.summary}
          </h2>
          <p className="mt-2 text-muted">{r.summary}</p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/cv/${id}/problems`} className={cn(cardClass, "group p-5 transition-colors duration-200 hover:border-primary/50 sm:p-6")}>
          <p className="text-3xl font-bold tabular-nums">{num(problems)}</p>
          <p className="mt-1 font-semibold">{fill(t.problemsCount, { n: num(problems) })}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            {t.sections.problems}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
        {r.aiAvailable ? (
          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-primary p-5 text-primary-fg sm:p-6">
            <div className="flex items-start gap-3">
              <MessageCircleQuestion className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <p className="font-semibold">{questions ? fill(t.questionsCta, { n: num(questions) }) : t.writeNow}</p>
            </div>
            <Link
              href={`/cv/${id}/${questions ? "questions" : "improved"}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-fg px-4 font-semibold text-primary transition-opacity duration-200 hover:opacity-90"
            >
              {questions ? t.sections.questions : t.writeNow}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>

      <section className={cn(cardClass, "p-5 sm:p-6")}>
        <h2 className="font-semibold">{m.common.progress}</h2>
        <div className="mt-3">
          <JobProgress steps={job.steps} labels={t.steps} running={false} />
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={onDelete} disabled={deleting} className={buttonClass("ghost", "text-danger hover:text-danger")}>
          <Trash2 className="size-4" aria-hidden="true" />
          {m.common.delete}
        </button>
      </div>
    </div>
  );
}
