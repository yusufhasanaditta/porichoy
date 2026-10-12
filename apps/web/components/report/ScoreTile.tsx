"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { TONE_COLOR, scoreTone } from "@/components/ScoreRing";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function ScoreTile({ label, score, href, sub }: { label: string; score: number | null; href?: string; sub?: string }) {
  const { m, num } = useApp();
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {href ? <ArrowRight className="size-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" /> : null}
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums">{score === null ? "—" : num(score)}</p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"
        role="meter"
        aria-label={label}
        aria-valuenow={score ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {score !== null ? <div className="h-full rounded-full" style={{ width: `${score}%`, background: TONE_COLOR[scoreTone(score)] }} /> : null}
      </div>
      <p className="mt-2 text-xs text-muted">{score === null ? m.common.notMeasured : (sub ?? m.common.rating[scoreTone(score)])}</p>
    </>
  );
  const cls = "group block rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors duration-200";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-primary/50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
