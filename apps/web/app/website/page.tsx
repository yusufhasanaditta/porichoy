"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Globe, LoaderCircle, ScanSearch } from "lucide-react";

import { LangPicker } from "@/components/LangPicker";
import { buttonClass, cardClass, inputClass } from "@/components/ui";
import { ApiError, postJson } from "@/lib/api";
import { useApp } from "@/lib/providers";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

function looksLikeUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

export default function WebsiteStartPage() {
  const { m, lang } = useApp();
  const t = m.website;
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [reportLang, setReportLang] = useState<Lang>(lang);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalid = touched && !looksLikeUrl(url);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!looksLikeUrl(url)) {
      document.getElementById("url")?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await postJson<{ id: string }>("/v1/website/analyze", { url: url.trim(), lang: reportLang });
      router.push(`/website/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-16">
      <div className="animate-fade-up">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Globe className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-3 text-muted">{t.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className={cn(cardClass, "mt-8 space-y-6 p-5 sm:p-6")}>
        <div>
          <label htmlFor="url" className="text-sm font-semibold">
            {t.urlLabel}
          </label>
          <input
            id="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t.urlPlaceholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "url-error" : "url-help"}
            className={cn(inputClass, "mt-2")}
          />
          {invalid ? (
            <p id="url-error" role="alert" className="mt-2 text-sm text-danger">
              {t.urlError}
            </p>
          ) : (
            <p id="url-help" className="mt-2 text-sm text-muted">
              {t.urlHelp}
            </p>
          )}
        </div>

        <LangPicker value={reportLang} onChange={setReportLang} />

        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} aria-busy={submitting} className={buttonClass("primary", "h-12 w-full text-base")}>
          {submitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ScanSearch className="size-4" aria-hidden="true" />}
          {submitting ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  );
}
