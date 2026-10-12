"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type Tone = "low" | "mid" | "high";

export function scoreTone(score: number): Tone {
  if (score < 50) return "low";
  if (score < 75) return "mid";
  return "high";
}

export const TONE_COLOR: Record<Tone, string> = {
  low: "var(--danger)",
  mid: "var(--warn)",
  high: "var(--success)",
};

interface Props {
  score: number;
  size?: number;
  label: string;
  display: string;
  sublabel?: string;
  className?: string;
}

/** Circular score gauge. The number is always shown as text, so color is never the only signal. */
export function ScoreRing({ score, size = 160, label, display, sublabel, className }: Props) {
  const [shown, setShown] = useState(0);
  const stroke = Math.max(8, size / 14);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${score}/100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_COLOR[scoreTone(score)]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center" aria-hidden="true">
        <span className="font-bold leading-none tabular-nums" style={{ fontSize: size * 0.28 }}>
          {display}
        </span>
        {sublabel ? <span className="mt-1 text-xs text-muted">{sublabel}</span> : null}
      </div>
    </div>
  );
}
