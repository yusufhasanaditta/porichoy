"use client";

import { useState } from "react";
import { Check, CircleCheck, CircleX, Copy, ShieldCheck, Undo2, X } from "lucide-react";

import { buttonClass, cardClass } from "@/components/ui";
import type { Rewrite, Verdict } from "@/lib/demo-data";
import { useApp } from "@/lib/providers";
import { cn, fill } from "@/lib/utils";

type Decision = "pending" | "approved" | "rejected";

export function RewriteCard({ rewrite }: { rewrite: Rewrite }) {
  const { m, lang, num } = useApp();
  const [decision, setDecision] = useState<Decision>("pending");
  const [copied, setCopied] = useState(false);
  const final = rewrite.attempts[rewrite.attempts.length - 1];
  if (!final) return null;

  async function copy() {
    if (!final) return;
    try {
      await navigator.clipboard.writeText(final.proposed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className={cn(cardClass, "p-5")}>
      <h3 className="font-semibold">{rewrite.target[lang]}</h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{m.dash.before}</p>
          <p className="mt-1.5 break-words text-sm text-muted line-through decoration-danger/50">{rewrite.original}</p>
        </div>
        <div className="rounded-xl border border-primary/40 bg-primary-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{m.dash.after}</p>
          <p className="mt-1.5 break-words text-sm font-medium">{final.proposed}</p>
          <p className="mt-2 text-xs text-muted tabular-nums">{fill(m.dash.chars, { n: num(final.proposed.length) })}</p>
        </div>
      </div>

      {/* Verifier history: shows the rejected first draft when there was one. */}
      <div className="mt-4 rounded-xl border border-border p-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          {m.dash.verifier}
        </p>
        <ol className="mt-3 space-y-3">
          {rewrite.attempts.map((a, i) => (
            <li key={i} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">{fill(m.dash.attempt, { n: num(i + 1) })}</span>
                <VerdictBadge pass={a.verdict.pass} />
              </div>
              {!a.verdict.pass ? (
                <div className="mt-2 space-y-2">
                  <p className="break-words text-muted">“{a.proposed}”</p>
                  {a.verdict.unsupportedClaims.map((claim) => (
                    <p key={claim} className="text-xs">
                      <span className="font-medium text-danger">{m.dash.unsupported}: </span>
                      <mark className="rounded bg-danger-soft px-1 text-danger">{claim}</mark>
                    </p>
                  ))}
                  {a.verdict.feedback ? <p className="text-xs text-muted">{a.verdict.feedback[lang]}</p> : null}
                </div>
              ) : (
                <ScoreBars verdict={a.verdict} />
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4" aria-live="polite">
        {decision === "pending" ? (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button type="button" onClick={() => setDecision("rejected")} className={buttonClass("secondary")}>
              <X className="size-4" aria-hidden="true" />
              {m.dash.reject}
            </button>
            <button type="button" onClick={() => setDecision("approved")} className={buttonClass("primary")}>
              <Check className="size-4" aria-hidden="true" />
              {m.dash.approve}
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between",
              decision === "approved" ? "bg-success-soft" : "bg-surface-2",
            )}
          >
            <p className={cn("text-sm font-medium", decision === "approved" ? "text-success" : "text-muted")}>
              {decision === "approved" ? m.dash.approved : m.dash.rejectedByYou}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDecision("pending")} className={buttonClass("ghost")}>
                <Undo2 className="size-4" aria-hidden="true" />
                {m.dash.undo}
              </button>
              {decision === "approved" ? (
                <button type="button" onClick={copy} className={buttonClass("primary")}>
                  {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                  {copied ? m.dash.copied : m.dash.copy}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function VerdictBadge({ pass }: { pass: boolean }) {
  const { m } = useApp();
  return pass ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
      <CircleCheck className="size-3.5" aria-hidden="true" />
      {m.dash.passed}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
      <CircleX className="size-3.5" aria-hidden="true" />
      {m.dash.rejected}
    </span>
  );
}

function ScoreBars({ verdict }: { verdict: Verdict }) {
  const { m, num } = useApp();
  const entries = Object.entries(verdict.scores) as [keyof Verdict["scores"], number][];
  return (
    <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <dt className="w-36 shrink-0 text-xs text-muted">{m.dash.scoreNames[key]}</dt>
          <dd className="flex flex-1 items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <span className="block h-full rounded-full bg-success" style={{ width: `${(value / 5) * 100}%` }} />
            </span>
            <span className="w-7 text-right text-xs tabular-nums">{num(value)}/{num(5)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
