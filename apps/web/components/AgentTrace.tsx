"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, RotateCcw } from "lucide-react";

import { traceSteps } from "@/lib/demo-data";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const STEP_DELAY_MS = 550;

/** Replays the agent pipeline. In production each step comes from Firestore users/{uid}/scans/{id}/trace. */
export function AgentTrace() {
  const { m, num } = useApp();
  const [done, setDone] = useState(0);

  const replay = useCallback(() => setDone(0), []);

  useEffect(() => {
    if (done >= traceSteps.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // With reduced motion, skip the replay and show every step as finished at once.
    const id = setTimeout(() => setDone((d) => (reduced ? traceSteps.length : d + 1)), reduced ? 0 : STEP_DELAY_MS);
    return () => clearTimeout(id);
  }, [done]);

  const finished = done >= traceSteps.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{m.dash.trace}</h2>
        <button
          type="button"
          onClick={replay}
          disabled={!finished}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors duration-200 hover:text-fg disabled:cursor-default disabled:opacity-40"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {m.dash.replay}
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-1 text-sm text-muted">
        {finished ? m.dash.traceDone : m.dash.traceRunning}
      </p>
      <ol className="mt-4 space-y-0">
        {traceSteps.map((step, i) => {
          const state = i < done ? "done" : i === done ? "running" : "pending";
          return (
            <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
              {i < traceSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 transition-colors duration-300",
                    state === "done" ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300",
                  state === "done" && "border-primary bg-primary text-primary-fg",
                  state === "running" && "border-primary bg-surface text-primary",
                  state === "pending" && "border-border bg-surface",
                )}
                aria-hidden="true"
              >
                {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : null}
                {state === "running" ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
              </span>
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <span className={cn("text-sm", state === "pending" ? "text-muted" : "font-medium")}>{m.dash.steps[step.key]}</span>
                {state === "done" ? (
                  <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{num(Number((step.ms / 1000).toFixed(1)))}s</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
