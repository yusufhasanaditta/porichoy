"use client";

import { cn, normalizeForMatch } from "@/lib/utils";

interface Line {
  n: number;
  text: string;
}

/** Shows the CV line a problem points to, with one line of context above and below and the quote highlighted. */
export function CvLines({ lines, target, quote }: { lines: Line[]; target: number; quote?: string }) {
  const shown = lines.filter((l) => l.n >= target - 1 && l.n <= target + 1);
  if (!shown.length) return null;
  return (
    <div className="mt-1.5 overflow-hidden rounded-lg border border-border font-mono text-xs sm:text-sm">
      {shown.map((l) => (
        <div key={l.n} className={cn("flex gap-3 px-3 py-1.5", l.n === target ? "bg-danger-soft" : "bg-surface-2 text-muted")}>
          <span className="w-6 shrink-0 select-none text-right tabular-nums opacity-60" aria-hidden="true">
            {l.n}
          </span>
          <span className="min-w-0 break-words">{l.n === target && quote ? <Highlight text={l.text} quote={quote} /> : l.text}</span>
        </div>
      ))}
    </div>
  );
}

function Highlight({ text, quote }: { text: string; quote: string }) {
  const start = normalizeForMatch(text).indexOf(normalizeForMatch(quote));
  if (start < 0 || normalizeForMatch(text).length !== text.length) return <>{text}</>;
  const end = start + quote.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-danger/20 px-0.5 text-fg">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}
