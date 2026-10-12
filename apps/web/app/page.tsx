"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  FileSearch,
  GitCompareArrows,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Upload,
  Bot,
} from "lucide-react";

import { ScoreRing } from "@/components/ScoreRing";
import { buttonClass, cardClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Upload, Bot, BadgeCheck];
const FEATURE_ICONS = [Quote, ShieldCheck, Scale, GitCompareArrows, Target, BriefcaseBusiness];

export default function LandingPage() {
  const { m, num } = useApp();
  const t = m.landing;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(60%_60%_at_50%_30%,var(--primary-soft),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              {t.badge}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {t.title}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-muted">{t.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/scan/new" className={buttonClass("primary", "h-12 px-6 text-base")}>
                {t.ctaPrimary}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/dashboard" className={buttonClass("secondary", "h-12 px-6 text-base")}>
                {t.ctaSecondary}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {t.stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-bold tabular-nums text-fg sm:text-3xl">{s.value}</dd>
                  <dd className="text-xs leading-snug text-muted sm:text-sm">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product preview */}
          <div className="animate-fade-up [animation-delay:120ms]">
            <div className={cn(cardClass, "mx-auto max-w-md p-5 sm:p-6")}>
              <p className="text-sm font-semibold">{t.previewTitle}</p>
              <div className="mt-4 flex items-center justify-around gap-4">
                <div className="text-center">
                  <ScoreRing score={54} size={112} label={t.previewBefore} display={num(54)} />
                  <p className="mt-2 text-xs font-medium text-muted">{t.previewBefore}</p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
                <div className="text-center">
                  <ScoreRing score={81} size={112} label={t.previewAfter} display={num(81)} />
                  <p className="mt-2 text-xs font-medium text-muted">{t.previewAfter}</p>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t.previewFinding}</p>
                    <p className="mt-1 break-words font-mono text-xs text-muted">linkedin:headline</p>
                    <p className="mt-2 rounded-md border-l-2 border-danger bg-danger-soft px-2 py-1 font-mono text-xs">
                      “Web Designer at Freelance”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="how" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t.howTitle}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {t.steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? FileSearch;
              return (
                <li key={step.title} className="relative rounded-2xl border border-border bg-bg p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-muted tabular-nums">{num(i + 1)}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="features" className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t.featuresTitle}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? Sparkles;
            return (
              <li key={f.title} className={cn(cardClass, "p-6 transition-colors duration-200 hover:border-primary/40")}>
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-fg sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t.ctaTitle}</h2>
            <p className="mt-2 opacity-90">{t.ctaBody}</p>
          </div>
          <Link
            href="/scan/new"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary-fg px-6 font-semibold text-primary transition-opacity duration-200 hover:opacity-90"
          >
            {t.ctaPrimary}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
