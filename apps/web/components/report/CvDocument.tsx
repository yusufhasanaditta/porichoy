"use client";

import type { ImprovedCv } from "@/lib/types";

type Headings = Record<"summary" | "experience" | "projects" | "education" | "skills" | "certifications" | "languages", string>;

const dates = (a: string | null, b: string | null) => [a, b].filter(Boolean).join(" – ");

/** The new CV as a paper-style, single-column, ATS-friendly document. Also what "Save as PDF" prints. */
export function CvDocument({ cv, headings }: { cv: ImprovedCv; headings: Headings }) {
  const contact = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.website].filter(Boolean);
  return (
    <article lang="en" className="print-area rounded-2xl bg-white p-6 text-[13px] leading-relaxed text-neutral-900 shadow-card ring-1 ring-black/5 sm:p-10">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">{cv.name}</h2>
        <p className="mt-0.5 text-base font-medium text-[#006a4e]">{cv.headline}</p>
        {contact.length ? <p className="mt-2 break-words text-neutral-600">{contact.join(" · ")}</p> : null}
      </header>

      {cv.summary ? (
        <Section title={headings.summary}>
          <p>{cv.summary}</p>
        </Section>
      ) : null}

      {cv.experience.length ? (
        <Section title={headings.experience}>
          <div className="space-y-4">
            {cv.experience.map((job, i) => (
              <div key={i} className="break-inside-avoid">
                <div className="flex flex-col justify-between gap-x-4 sm:flex-row sm:items-baseline">
                  <p className="font-semibold text-neutral-950">
                    {job.title} — {job.company}
                  </p>
                  <p className="shrink-0 text-neutral-600">{[job.location, dates(job.start, job.end)].filter(Boolean).join(" · ")}</p>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {job.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {cv.projects.length ? (
        <Section title={headings.projects}>
          <div className="space-y-3">
            {cv.projects.map((p, i) => (
              <div key={i} className="break-inside-avoid">
                <p className="font-semibold text-neutral-950">{p.name}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {p.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {cv.education.length ? (
        <Section title={headings.education}>
          <div className="space-y-2">
            {cv.education.map((ed, i) => (
              <div key={i} className="flex flex-col justify-between gap-x-4 sm:flex-row sm:items-baseline">
                <p>
                  <span className="font-semibold text-neutral-950">{ed.degree}</span> — {ed.school}
                  {ed.details ? <span className="text-neutral-600"> · {ed.details}</span> : null}
                </p>
                <p className="shrink-0 text-neutral-600">{dates(ed.start, ed.end)}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {cv.skills.length ? (
        <Section title={headings.skills}>
          <ul className="space-y-0.5">
            {cv.skills.map((g, i) => (
              <li key={i}>
                <span className="font-semibold text-neutral-950">{g.category}:</span> {g.items.join(", ")}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {cv.certifications.length ? (
        <Section title={headings.certifications}>
          <p>{cv.certifications.join(" · ")}</p>
        </Section>
      ) : null}
      {cv.languages.length ? (
        <Section title={headings.languages}>
          <p>{cv.languages.join(", ")}</p>
        </Section>
      ) : null}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-1.5 border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-widest text-[#006a4e]">{title}</h3>
      {children}
    </section>
  );
}

export function cvToText(cv: ImprovedCv, headings: Headings): string {
  const out: string[] = [cv.name, cv.headline];
  const contact = [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.website].filter(Boolean);
  if (contact.length) out.push(contact.join(" | "));
  if (cv.summary) out.push("", headings.summary.toUpperCase(), cv.summary);
  if (cv.experience.length) {
    out.push("", headings.experience.toUpperCase());
    for (const j of cv.experience) {
      out.push(`${j.title} — ${j.company}${j.location ? `, ${j.location}` : ""} (${dates(j.start, j.end)})`, ...j.bullets.map((b) => `• ${b}`), "");
    }
  }
  if (cv.projects.length) {
    out.push(headings.projects.toUpperCase());
    for (const p of cv.projects) out.push(p.name, ...p.bullets.map((b) => `• ${b}`), "");
  }
  if (cv.education.length) {
    out.push(headings.education.toUpperCase());
    for (const e of cv.education) out.push(`${e.degree} — ${e.school} ${dates(e.start, e.end)}`.trim());
  }
  if (cv.skills.length) out.push("", headings.skills.toUpperCase(), ...cv.skills.map((g) => `${g.category}: ${g.items.join(", ")}`));
  if (cv.certifications.length) out.push("", headings.certifications.toUpperCase(), cv.certifications.join(", "));
  if (cv.languages.length) out.push("", headings.languages.toUpperCase(), cv.languages.join(", "));
  return out.join("\n").trim();
}
