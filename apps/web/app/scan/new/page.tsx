"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { BriefcaseBusiness, FileText, Globe, LoaderCircle, Lock, ScanSearch } from "lucide-react";

import { FileDrop } from "@/components/FileDrop";
import { buttonClass, cardClass } from "@/components/ui";
import { useApp, type Lang } from "@/lib/providers";
import { cn } from "@/lib/utils";

type LinkedinMode = "pdf" | "paste";

const inputClass =
  "block min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-fg placeholder:text-muted/70 " +
  "transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-danger";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function NewScanPage() {
  const { m, lang } = useApp();
  const t = m.scan;
  const router = useRouter();

  const [website, setWebsite] = useState("");
  const [websiteTouched, setWebsiteTouched] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [liMode, setLiMode] = useState<LinkedinMode>("pdf");
  const [liPdf, setLiPdf] = useState<File | null>(null);
  const [liText, setLiText] = useState("");
  const [niche, setNiche] = useState("");
  const [reportLang, setReportLang] = useState<Lang>(lang);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const websiteInvalid = websiteTouched && website.trim() !== "" && !isValidUrl(website.trim());
  const hasLinkedin = liMode === "pdf" ? liPdf !== null : liText.trim().length > 0;
  const hasSource = (website.trim() !== "" && !websiteInvalid) || cv !== null || hasLinkedin;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setWebsiteTouched(true);
    if (website.trim() !== "" && !isValidUrl(website.trim())) {
      document.getElementById("website")?.focus();
      return;
    }
    if (!hasSource) {
      setFormError(t.needOne);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    // The real POST /v1/scans call lands in milestone 5; for now open the sample report.
    setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-14">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-2 text-muted">{t.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Section icon={<Globe className="size-5" />} title={t.websiteLabel} optional={t.optional}>
          <label htmlFor="website" className="sr-only">
            {t.websiteLabel}
          </label>
          <input
            id="website"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder={t.websitePlaceholder}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={() => setWebsiteTouched(true)}
            aria-invalid={websiteInvalid || undefined}
            aria-describedby={websiteInvalid ? "website-error" : "website-help"}
            className={inputClass}
          />
          {websiteInvalid ? (
            <p id="website-error" role="alert" className="mt-2 text-sm text-danger">
              {t.websiteError}
            </p>
          ) : (
            <p id="website-help" className="mt-2 text-sm text-muted">
              {t.websiteHelp}
            </p>
          )}
        </Section>

        <Section icon={<FileText className="size-5" />} title={t.cvLabel} optional={t.optional}>
          <FileDrop file={cv} onChange={setCv} label={t.cvLabel} dropText={t.cvDrop} describedBy="cv-help" />
          <p id="cv-help" className="mt-2 text-sm text-muted">
            {t.cvHelp}
          </p>
        </Section>

        <Section icon={<BriefcaseBusiness className="size-5" />} title={t.linkedinLabel} optional={t.optional}>
          <div role="radiogroup" aria-label={t.linkedinLabel} className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
            {(["pdf", "paste"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={liMode === mode}
                onClick={() => setLiMode(mode)}
                className={cn(
                  "min-h-10 cursor-pointer rounded-lg text-sm font-medium transition-colors duration-200",
                  liMode === mode ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
                )}
              >
                {mode === "pdf" ? t.linkedinPdf : t.linkedinPaste}
              </button>
            ))}
          </div>
          {liMode === "pdf" ? (
            <>
              <FileDrop file={liPdf} onChange={setLiPdf} label={t.linkedinLabel} dropText={t.liDrop} describedBy="li-help" />
              <p id="li-help" className="mt-2 text-sm text-muted">
                {t.linkedinPdfHelp}
              </p>
            </>
          ) : (
            <>
              <label htmlFor="li-text" className="sr-only">
                {t.linkedinLabel}
              </label>
              <textarea
                id="li-text"
                rows={6}
                value={liText}
                onChange={(e) => setLiText(e.target.value)}
                placeholder={t.linkedinPastePlaceholder}
                aria-describedby="li-help"
                className={cn(inputClass, "py-3")}
              />
              <p id="li-help" className="mt-2 text-sm text-muted">
                {t.linkedinPasteHelp}
              </p>
            </>
          )}
        </Section>

        <div className={cn(cardClass, "grid gap-5 p-5 sm:grid-cols-2 sm:p-6")}>
          <div>
            <label htmlFor="niche" className="text-sm font-semibold">
              {t.nicheLabel}
            </label>
            <input
              id="niche"
              type="text"
              autoComplete="organization-title"
              placeholder={t.nichePlaceholder}
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              aria-describedby="niche-help"
              className={cn(inputClass, "mt-2")}
            />
            <p id="niche-help" className="mt-2 text-sm text-muted">
              {t.nicheHelp}
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">{t.langLabel}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["en", "bn"] as const).map((l) => (
                <label
                  key={l}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition-colors duration-200",
                    reportLang === l ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-2",
                  )}
                >
                  <input
                    type="radio"
                    name="reportLang"
                    value={l}
                    checked={reportLang === l}
                    onChange={() => setReportLang(l)}
                    className="sr-only"
                  />
                  {l === "en" ? t.langEn : t.langBn}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {formError ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t.privacy}
          </p>
          <button type="submit" disabled={submitting} aria-busy={submitting} className={buttonClass("primary", "h-12 shrink-0 px-6 text-base")}>
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ScanSearch className="size-4" aria-hidden="true" />
            )}
            {submitting ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon, title, optional, children }: { icon: ReactNode; title: string; optional: string; children: ReactNode }) {
  return (
    <section className={cn(cardClass, "p-5 sm:p-6")}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary" aria-hidden="true">
          {icon}
        </span>
        <h2 className="font-semibold">{title}</h2>
        <span className="ml-auto text-xs text-muted">{optional}</span>
      </div>
      {children}
    </section>
  );
}
