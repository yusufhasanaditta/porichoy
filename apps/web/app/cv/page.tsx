"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FileText, LoaderCircle, Lock, ScanSearch } from "lucide-react";

import { FileDrop } from "@/components/FileDrop";
import { LangPicker } from "@/components/LangPicker";
import { buttonClass, cardClass, inputClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/lib/providers";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CvStartPage() {
  const { m, lang } = useApp();
  const t = m.cv;
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [reportLang, setReportLang] = useState<Lang>(lang);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t.needFile);
      return;
    }
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("lang", reportLang);
    form.append("target_role", role.trim());
    try {
      const { id } = await api<{ id: string }>("/v1/cv/analyze", { method: "POST", body: form });
      router.push(`/cv/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-16">
      <div className="animate-fade-up">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
          <FileText className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-3 text-muted">{t.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className={cn(cardClass, "mt-8 space-y-6 p-5 sm:p-6")}>
        <div>
          <p className="text-sm font-semibold">{t.fileLabel}</p>
          <div className="mt-2">
            <FileDrop
              file={file}
              onChange={(f) => {
                setFile(f);
                if (f) setError(null);
              }}
              label={t.fileLabel}
              dropText={t.drop}
              describedBy="cv-help"
            />
          </div>
          <p id="cv-help" className="mt-2 text-sm text-muted">
            {t.fileHelp}
          </p>
        </div>

        <div>
          <label htmlFor="role" className="text-sm font-semibold">
            {t.roleLabel}
          </label>
          <input
            id="role"
            type="text"
            autoComplete="organization-title"
            maxLength={120}
            placeholder={t.rolePlaceholder}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-describedby="role-help"
            className={cn(inputClass, "mt-2")}
          />
          <p id="role-help" className="mt-2 text-sm text-muted">
            {t.roleHelp}
          </p>
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
        <p className="flex items-start gap-2 text-sm text-muted">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t.privacy}
        </p>
      </form>
    </div>
  );
}
