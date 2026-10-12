"use client";

import Link from "next/link";
import { LoaderCircle, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";

import { buttonClass, cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function LoadingState({ label }: { label?: string }) {
  const { m } = useApp();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-20 text-muted">
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      {label ?? m.common.loading}
    </div>
  );
}

export function ErrorState({ message, onRetry, newHref }: { message: string; onRetry?: () => void; newHref: string }) {
  const { m } = useApp();
  return (
    <div role="alert" className={cn(cardClass, "mx-auto my-12 max-w-lg p-8 text-center")}>
      <TriangleAlert className="mx-auto size-8 text-danger" aria-hidden="true" />
      <p className="mt-4 font-medium">{message}</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {onRetry ? (
          <button type="button" onClick={onRetry} className={buttonClass("secondary")}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {m.common.retry}
          </button>
        ) : null}
        <Link href={newHref} className={buttonClass("primary")}>
          {m.common.startNew}
        </Link>
      </div>
    </div>
  );
}

export function AiOffNotice() {
  const { m } = useApp();
  return (
    <p className="flex items-start gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">
      <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {m.common.aiOff}
    </p>
  );
}
