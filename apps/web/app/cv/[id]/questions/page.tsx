"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, MessageCircleQuestion, PenLine } from "lucide-react";

import { CvLines } from "@/components/report/CvLines";
import { AiOffNotice } from "@/components/report/StateViews";
import { buttonClass, cardClass, inputClass } from "@/components/ui";
import { ApiError, postJson } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { useCvReport } from "@/lib/report-context";
import { cn, fill } from "@/lib/utils";

export default function CvQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { m, num } = useApp();
  const t = m.cv;
  const { job, refresh } = useCvReport();
  const r = job.result;
  const questions = r.questions ?? [];
  const previous = Object.fromEntries((r.improve?.answers ?? []).map((a) => [a.questionId, a.answer]));

  const [answers, setAnswers] = useState<Record<string, string>>(previous);
  const [role, setRole] = useState(r.targetRole ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!r.aiAvailable) return <AiOffNotice />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postJson(`/v1/cv/${id}/improve`, {
        targetRole: role.trim() || null,
        answers: questions.map((q) => ({ questionId: q.id, question: q.question, answer: (answers[q.id] ?? "").trim() })),
      });
      refresh();
      router.push(`/cv/${id}/improved`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircleQuestion className="size-6 text-primary" aria-hidden="true" />
          {t.questionsTitle}
        </h2>
        <p className="mt-2 text-muted">{t.questionsIntro}</p>
      </div>

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className={cn(cardClass, "p-5")}>
            <label htmlFor={`q-${q.id}`} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary tabular-nums">
                {num(i + 1)}
              </span>
              <span className="font-semibold">{q.question}</span>
            </label>
            <p id={`q-${q.id}-why`} className="mt-2 text-sm text-muted sm:pl-10">
              {q.why}
            </p>
            {q.related_line ? (
              <div className="mt-2 sm:pl-10">
                <p className="text-xs text-muted">{fill(t.aboutLine, { n: num(q.related_line) })}</p>
                <CvLines lines={r.lines ?? []} target={q.related_line} />
              </div>
            ) : null}
            <div className="mt-3 sm:pl-10">
              <textarea
                id={`q-${q.id}`}
                rows={2}
                maxLength={1500}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder={q.example_answer ?? t.answerPlaceholder}
                aria-describedby={`q-${q.id}-why`}
                className={cn(inputClass, "py-3")}
              />
            </div>
          </li>
        ))}
      </ol>

      <div className={cn(cardClass, "p-5")}>
        <label htmlFor="role" className="text-sm font-semibold">
          {t.roleLabel}
        </label>
        <input
          id="role"
          type="text"
          maxLength={120}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t.rolePlaceholder}
          className={cn(inputClass, "mt-2")}
        />
        <p className="mt-2 text-sm text-muted">{t.roleHelp}</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} aria-busy={submitting} className={buttonClass("primary", "h-12 w-full text-base sm:w-auto sm:px-8")}>
        {submitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <PenLine className="size-4" aria-hidden="true" />}
        {t.submitAnswers}
      </button>
    </form>
  );
}
