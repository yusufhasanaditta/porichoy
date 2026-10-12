"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CircleCheck, Download, LoaderCircle, PenLine, Printer, ShieldCheck, TriangleAlert } from "lucide-react";

import { CopyButton } from "@/components/CopyButton";
import { CvDocument, cvToText } from "@/components/report/CvDocument";
import { AiOffNotice } from "@/components/report/StateViews";
import { buttonClass, cardClass } from "@/components/ui";
import { API_URL, ApiError, postJson } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { useCvReport } from "@/lib/report-context";
import { cn, fill } from "@/lib/utils";

export default function CvImprovedPage() {
  const { id } = useParams<{ id: string }>();
  const { m, num } = useApp();
  const t = m.cv;
  const { job, refresh } = useCvReport();
  const r = job.result;
  const imp = r.improve;
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      await postJson(`/v1/cv/${id}/improve`, { answers: imp?.answers ?? [] });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  if (!r.aiAvailable) return <AiOffNotice />;

  if (!imp || imp.status === "error") {
    return (
      <div className={cn(cardClass, "p-8 text-center")}>
        <PenLine className="mx-auto size-8 text-primary" aria-hidden="true" />
        <p className="mt-4 font-semibold">{imp?.error ?? t.notStarted}</p>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {r.questions?.length ? (
            <Link href={`/cv/${id}/questions`} className={buttonClass("primary")}>
              {t.goQuestions}
            </Link>
          ) : null}
          <button type="button" onClick={start} disabled={starting} className={buttonClass(r.questions?.length ? "secondary" : "primary")}>
            {starting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            {imp?.status === "error" ? m.common.retry : t.writeNow}
          </button>
        </div>
      </div>
    );
  }

  if (imp.status === "running" || !imp.cv) {
    return (
      <div role="status" aria-live="polite" className={cn(cardClass, "p-10 text-center")}>
        <LoaderCircle className="mx-auto size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold">{t.writing}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t.writingHint}</p>
      </div>
    );
  }

  const cv = imp.cv;
  const rounds = imp.attempts ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap print:hidden">
        <a href={`${API_URL}/v1/cv/${id}/improved.docx`} className={buttonClass("primary")}>
          <Download className="size-4" aria-hidden="true" />
          {t.download}
        </a>
        <button type="button" onClick={() => window.print()} className={buttonClass("secondary")}>
          <Printer className="size-4" aria-hidden="true" />
          {t.print}
        </button>
        <CopyButton text={cvToText(cv, t.headings)} label={t.copyText} />
        <Link href={`/cv/${id}/questions`} className={buttonClass("ghost")}>
          <PenLine className="size-4" aria-hidden="true" />
          {t.rewrite}
        </Link>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_320px]">
        <CvDocument cv={cv} headings={t.headings} />

        <div className="space-y-6 print:hidden">
          <section className={cn(cardClass, "p-5")}>
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              {t.verifier}
            </h2>
            <p className={cn("mt-2 flex items-start gap-2 text-sm font-medium", imp.verified ? "text-success" : "text-warn")}>
              {imp.verified ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
              {imp.verified ? t.verifiedOk : t.verifiedWarn}
            </p>
            <ol className="mt-4 space-y-4">
              {rounds.map((a) => (
                <li key={a.round} className="text-sm">
                  <p className="text-xs font-semibold text-muted">
                    {fill(t.round, { n: num(a.round) })} · {a.pass ? m.common.passed : m.common.failed}
                  </p>
                  <dl className="mt-1.5 grid grid-cols-3 gap-2">
                    {(["factual", "ats_friendly", "clarity"] as const).map((k) => (
                      <div key={k} className="rounded-lg bg-surface-2 px-2 py-1.5 text-center">
                        <dt className="text-[11px] text-muted">{t.scores[k]}</dt>
                        <dd className="font-semibold tabular-nums">
                          {num(a[k])}/{num(5)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {a.unsupported_claims.length ? (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-danger">{t.rejectedClaims}</p>
                      <ul className="mt-1 space-y-1">
                        {a.unsupported_claims.map((u, i) => (
                          <li key={i} className="text-xs">
                            <mark className="rounded bg-danger-soft px-1 text-danger">{u.text}</mark>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
            {imp.models ? <p className="mt-4 font-mono text-[11px] text-muted">{imp.models.writer} → {imp.models.verifier}</p> : null}
          </section>

          {cv.changes.length ? (
            <section className={cn(cardClass, "p-5")}>
              <h2 className="font-semibold">{t.changes}</h2>
              <ul className="mt-3 space-y-3">
                {cv.changes.map((c, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{c.what}</p>
                    <p className="mt-0.5 text-muted">{c.why}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
