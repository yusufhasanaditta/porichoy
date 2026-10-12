"use client";

import { Check, CircleMinus, LoaderCircle, X } from "lucide-react";

import { useApp } from "@/lib/providers";
import type { Step } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Live list of pipeline steps as reported by the API. */
export function JobProgress({ steps, labels, running }: { steps: Step[]; labels: Record<string, string>; running: boolean }) {
  const { m, num } = useApp();
  return (
    <div>
      <p role="status" aria-live="polite" className="text-sm font-medium text-muted">
        {running ? m.common.working : m.common.finished}
      </p>
      <ol className="mt-3 space-y-2.5">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2",
                step.status === "done" && "border-primary bg-primary text-primary-fg",
                step.status === "running" && "border-primary text-primary",
                step.status === "pending" && "border-border",
                step.status === "skipped" && "border-border text-muted",
                step.status === "error" && "border-warn bg-warn-soft text-warn",
              )}
            >
              {step.status === "done" ? <Check className="size-3.5" strokeWidth={3} /> : null}
              {step.status === "running" ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
              {step.status === "skipped" ? <CircleMinus className="size-3.5" /> : null}
              {step.status === "error" ? <X className="size-3.5" strokeWidth={3} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-sm", step.status === "pending" ? "text-muted" : "font-medium")}>{labels[step.key] ?? step.key}</span>
                {step.ms !== null && step.status !== "pending" ? (
                  <span className="shrink-0 font-mono text-xs text-muted tabular-nums">{num(Number((step.ms / 1000).toFixed(1)))}s</span>
                ) : null}
              </div>
              {step.note ? <p className="mt-0.5 text-xs text-muted">{step.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
