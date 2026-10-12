"use client";

import { notFound, useParams } from "next/navigation";
import { Sparkles } from "lucide-react";

import { CopyButton } from "@/components/CopyButton";
import { CheckCard } from "@/components/report/CheckCard";
import { FindingCard } from "@/components/report/FindingCard";
import { AiOffNotice } from "@/components/report/StateViews";
import { cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { useWebsiteReport } from "@/lib/report-context";
import { WEB_SECTIONS, type WebSection } from "@/lib/types";
import { cn, fill } from "@/lib/utils";

export default function WebsiteSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { m, num } = useApp();
  const t = m.website;
  const { job } = useWebsiteReport();
  if (!WEB_SECTIONS.includes(section as WebSection)) notFound();
  const s = section as WebSection;
  const r = job.result;

  // Failed first, then partial, then passed, then not measured.
  const order = (score: number | null) => (score === null ? 3 : score >= 1 ? 2 : score > 0 ? 1 : 0);
  const checks = (r.checks ?? []).filter((c) => c.section === s).sort((a, b) => order(a.score) - order(b.score) || b.weight - a.weight);
  const score = r.sections?.[s] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight">{t.sections[s]}</h2>
          <span className="text-2xl font-bold tabular-nums text-muted">{score === null ? "—" : num(score)}</span>
        </div>
        <p className="mt-1 text-muted">{t.sectionIntro[s]}</p>
      </div>

      {s === "content" && !r.aiAvailable ? <AiOffNotice /> : null}

      {s === "content" && r.contentOverall ? (
        <section className={cn(cardClass, "p-5")}>
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {t.aiSummary}
          </h3>
          <p className="mt-2 text-muted">{r.contentOverall}</p>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {checks.map((c) => (
          <CheckCard key={c.id} check={c} ns="web" />
        ))}
      </div>

      {s === "content" && r.findings?.length ? (
        <section>
          <h3 className="text-lg font-semibold">{t.findings}</h3>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            {r.findings.map((f, i) => (
              <FindingCard key={i} finding={f} />
            ))}
          </div>
        </section>
      ) : null}

      {(s === "content" || s === "onpage" || s === "schema") && r.suggestions ? (
        <section className={cn(cardClass, "p-5 sm:p-6")}>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {t.suggestions}
          </h3>
          <div className="mt-4 space-y-5">
            {s !== "schema" ? (
              <>
                <Suggestion label={t.newTitle} text={r.suggestions.title} />
                <Suggestion label={t.newMeta} text={r.suggestions.metaDescription} />
                <Suggestion label={t.newH1} text={r.suggestions.h1} />
              </>
            ) : null}
            {s !== "onpage" ? <Suggestion label={t.jsonLd} text={`<script type="application/ld+json">\n${r.suggestions.jsonLd}\n</script>`} code /> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Suggestion({ label, text, code }: { label: string; text: string; code?: boolean }) {
  const { m, num } = useApp();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <CopyButton text={text} />
      </div>
      {code ? (
        <pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-xs leading-relaxed">
          <code>{text}</code>
        </pre>
      ) : (
        <>
          <p className="mt-2 break-words rounded-xl border border-primary/30 bg-primary-soft px-3 py-2">{text}</p>
          <p className="mt-1 text-xs text-muted tabular-nums">
            {fill(m.common.chars, { n: num(text.length) })}
          </p>
        </>
      )}
    </div>
  );
}
