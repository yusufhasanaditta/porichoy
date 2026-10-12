// Shapes returned by the Porichoy API (services/api). Keep in sync with the Python pipelines.

export type Lang = "en" | "bn";
export type Severity = "critical" | "major" | "minor";
export type StepStatus = "pending" | "running" | "done" | "skipped" | "error";

export interface Step {
  key: string;
  status: StepStatus;
  ms: number | null;
  note: string | null;
}

export interface Evidence {
  locator: string;
  quote: string;
  line?: number;
}

export interface Check {
  id: string;
  section: string;
  weight: number;
  score: number | null;
  method: "rule" | "ai";
  evidence: Evidence | null;
  value: string | null;
  note: string | null;
}

export interface Finding {
  severity: Severity;
  section?: string;
  evidence: Evidence;
  problem: string;
  whyItHurts: string;
  fixHint: string;
}

export interface Job<R> {
  id: string;
  kind: "website" | "cv";
  status: "running" | "done" | "error";
  lang: Lang;
  steps: Step[];
  result: Partial<R>;
  error: string | null;
}

export const WEB_SECTIONS = ["technical", "onpage", "schema", "performance", "content"] as const;
export type WebSection = (typeof WEB_SECTIONS)[number];

export interface WebsiteResult {
  url: string;
  finalUrl: string;
  pages: { url: string; title: string | null; status: number }[];
  overall: number | null;
  sections: Record<WebSection, number | null>;
  checks: Check[];
  psi: { performance: number | null; lcp_ms: number | null; cls: number | null; inp_ms: number | null; tbt_ms: number | null; field_data: boolean } | null;
  aiAvailable: boolean;
  contentOverall: string | null;
  findings: Finding[];
  suggestions: { title: string; metaDescription: string; h1: string; jsonLd: string } | null;
}

export const CV_SECTIONS = ["format", "contact", "content"] as const;
export type CvSection = (typeof CV_SECTIONS)[number];

export interface CvQuestion {
  id: string;
  question: string;
  why: string;
  related_line: number | null;
  example_answer: string | null;
}

export interface ImprovedCv {
  name: string;
  headline: string;
  contact: { email: string | null; phone: string | null; location: string | null; linkedin: string | null; website: string | null };
  summary: string;
  experience: { title: string; company: string; location: string | null; start: string | null; end: string | null; bullets: string[] }[];
  projects: { name: string; bullets: string[] }[];
  education: { degree: string; school: string; start: string | null; end: string | null; details: string | null }[];
  skills: { category: string; items: string[] }[];
  certifications: string[];
  languages: string[];
  changes: { what: string; why: string }[];
}

export interface VerifierRound {
  round: number;
  pass: boolean;
  factual: number;
  ats_friendly: number;
  clarity: number;
  unsupported_claims: { text: string; reason: string }[];
  feedback: string;
}

export interface Improve {
  status: "running" | "done" | "error";
  error?: string;
  answers: { questionId: string; question: string; answer: string }[];
  cv?: ImprovedCv;
  attempts?: VerifierRound[];
  verified?: boolean;
  models?: { writer: string; verifier: string };
}

export interface CvResult {
  fileName: string;
  targetRole: string | null;
  pages: number;
  lines: { n: number; page: number; text: string }[];
  overall: number | null;
  sections: Record<CvSection, number | null>;
  checks: Check[];
  aiAvailable: boolean;
  candidateName: string | null;
  currentTitle: string | null;
  summary: string | null;
  findings: Finding[];
  questions: CvQuestion[];
  improve: Improve | null;
}
