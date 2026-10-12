// Sample scan used until the API's scan pipeline exists (milestones 4–7).
// Shapes follow the Finding / Rewrite / Verdict / ConsistencyFlag schemas in the blueprint.

export type Localized = { en: string; bn: string };
export type Severity = "critical" | "major" | "minor";
export type SourceType = "cv" | "linkedin" | "website";

export interface Finding {
  id: string;
  source: SourceType;
  severity: Severity;
  evidence: { locator: string; quote: string };
  problem: Localized;
  whyItHurts: Localized;
  fixHint: Localized;
}

export interface Verdict {
  pass: boolean;
  scores: { fixesFinding: number; factual: number; voice: number; length: number; language: number };
  unsupportedClaims: string[];
  feedback?: Localized;
}

export interface Rewrite {
  id: string;
  target: Localized;
  original: string;
  attempts: { proposed: string; verdict: Verdict }[];
}

export interface ConsistencyFlag {
  id: string;
  field: Localized;
  severity: Severity;
  values: { source: SourceType; value: string; locator: string }[];
  explanation: Localized;
  suggested: string;
}

export const scores = { presence: 54, linkedin: 48, website: 52, cv: 61, consistency: 65 } as const;

export const traceSteps = [
  { key: "ingest", ms: 2100 },
  { key: "auditCv", ms: 3400 },
  { key: "auditLinkedin", ms: 3100 },
  { key: "auditWebsite", ms: 4200 },
  { key: "consistency", ms: 1800 },
  { key: "rewrite", ms: 5600 },
  { key: "verify", ms: 3900 },
  { key: "score", ms: 300 },
] as const;

export const findings: Finding[] = [
  {
    id: "f1",
    source: "linkedin",
    severity: "critical",
    evidence: { locator: "linkedin:headline", quote: "Web Designer at Freelance" },
    problem: { en: "Your headline is only a job title.", bn: "আপনার হেডলাইনে শুধু পদবি লেখা।" },
    whyItHurts: {
      en: "Clients searching for “React developer” or “Shopify expert” won't find you, and the headline is the first thing they read.",
      bn: "যারা “React developer” বা “Shopify expert” খোঁজেন, তারা আপনাকে খুঁজে পাবেন না। অথচ হেডলাইনই তারা সবার আগে পড়েন।",
    },
    fixHint: {
      en: "Say what you build, who it's for, and one proof point.",
      bn: "কী বানান, কাদের জন্য, আর একটি প্রমাণ — এই তিনটি লিখুন।",
    },
  },
  {
    id: "f2",
    source: "website",
    severity: "major",
    evidence: { locator: "https://rahimdev.com · <title>", quote: "Home" },
    problem: { en: "Your homepage title is just “Home”.", bn: "আপনার হোমপেজের টাইটেল শুধু “Home”।" },
    whyItHurts: {
      en: "Google shows this title in search results, so nobody can tell who you are or what you do.",
      bn: "গুগল সার্চ রেজাল্টে এই টাইটেলই দেখায়, তাই কেউ বুঝতে পারে না আপনি কে বা কী করেন।",
    },
    fixHint: {
      en: "Use 30–60 characters with your name and your main service.",
      bn: "৩০–৬০ অক্ষরের মধ্যে আপনার নাম আর মূল সেবা লিখুন।",
    },
  },
  {
    id: "f3",
    source: "cv",
    severity: "major",
    evidence: { locator: "cv:line:14", quote: "Responsible for making websites for clients." },
    problem: { en: "This bullet describes a duty, not a result.", bn: "এই লাইনে দায়িত্বের কথা আছে, ফলাফলের কথা নেই।" },
    whyItHurts: {
      en: "Recruiters skim for outcomes and numbers. Bullets that only list duties get skipped.",
      bn: "রিক্রুটাররা দ্রুত চোখ বুলিয়ে ফলাফল আর সংখ্যা খোঁজেন। শুধু দায়িত্বের তালিকা তারা এড়িয়ে যান।",
    },
    fixHint: {
      en: "Start with an action verb and add a measurable result.",
      bn: "একটি কাজের ক্রিয়া দিয়ে শুরু করুন আর মাপা যায় এমন ফলাফল যোগ করুন।",
    },
  },
  {
    id: "f4",
    source: "website",
    severity: "minor",
    evidence: { locator: "https://rahimdev.com · meta", quote: '<meta name="description" content="">' },
    problem: { en: "The meta description is empty.", bn: "মেটা ডিসক্রিপশন ফাঁকা।" },
    whyItHurts: {
      en: "Google fills the gap with random page text, which lowers clicks from search.",
      bn: "গুগল ফাঁকা জায়গায় পেজের এলোমেলো লেখা বসায়, ফলে সার্চ থেকে ক্লিক কমে যায়।",
    },
    fixHint: {
      en: "Write 70–160 characters that say who you help and how.",
      bn: "৭০–১৬০ অক্ষরে লিখুন আপনি কাদের, কীভাবে সাহায্য করেন।",
    },
  },
  {
    id: "f5",
    source: "cv",
    severity: "minor",
    evidence: { locator: "cv:line:22", quote: "Jan 2022 – 03/2024" },
    problem: { en: "Date formats are mixed.", bn: "তারিখের ফরম্যাট মেশানো।" },
    whyItHurts: {
      en: "Applicant tracking systems can misread mixed formats and miscount your experience.",
      bn: "মেশানো ফরম্যাট হলে অ্যাপ্লিকেন্ট ট্র্যাকিং সিস্টেম ভুল পড়তে পারে এবং অভিজ্ঞতা কম গুনতে পারে।",
    },
    fixHint: { en: "Use one format everywhere, e.g. “Jan 2022 – Mar 2024”.", bn: "সব জায়গায় একই ফরম্যাট দিন, যেমন “Jan 2022 – Mar 2024”।" },
  },
];

export const rewrites: Rewrite[] = [
  {
    id: "r1",
    target: { en: "LinkedIn headline", bn: "লিংকডইন হেডলাইন" },
    original: "Web Designer at Freelance",
    attempts: [
      {
        proposed: "Full-stack developer who has shipped 50+ client websites | React & Shopify",
        verdict: {
          pass: false,
          scores: { fixesFinding: 4, factual: 1, voice: 4, length: 5, language: 5 },
          unsupportedClaims: ["50+ client websites"],
          feedback: {
            en: "Your sources mention 14 client projects, not 50+. Use only numbers from the CV.",
            bn: "আপনার উৎসে ১৪টি ক্লায়েন্ট প্রজেক্টের কথা আছে, ৫০+ নয়। শুধু সিভির সংখ্যা ব্যবহার করুন।",
          },
        },
      },
      {
        proposed: "React & Shopify developer helping small businesses launch fast, mobile-first websites | 14 client projects shipped",
        verdict: {
          pass: true,
          scores: { fixesFinding: 5, factual: 5, voice: 4, length: 5, language: 5 },
          unsupportedClaims: [],
        },
      },
    ],
  },
  {
    id: "r2",
    target: { en: "CV bullet · line 14", bn: "সিভির লাইন ১৪" },
    original: "Responsible for making websites for clients.",
    attempts: [
      {
        proposed: "Built 14 responsive client websites in React and Next.js, cutting average page load time from 4.1 s to 1.6 s.",
        verdict: {
          pass: true,
          scores: { fixesFinding: 5, factual: 5, voice: 5, length: 5, language: 5 },
          unsupportedClaims: [],
        },
      },
    ],
  },
  {
    id: "r3",
    target: { en: "Website title", bn: "ওয়েবসাইটের টাইটেল" },
    original: "Home",
    attempts: [
      {
        proposed: "Rahim Uddin – React & Shopify Developer in Dhaka",
        verdict: {
          pass: true,
          scores: { fixesFinding: 5, factual: 5, voice: 4, length: 5, language: 5 },
          unsupportedClaims: [],
        },
      },
    ],
  },
];

export const consistencyFlags: ConsistencyFlag[] = [
  {
    id: "c1",
    field: { en: "Job title", bn: "পদবি" },
    severity: "critical",
    values: [
      { source: "cv", value: "Senior Web Developer", locator: "cv:line:1" },
      { source: "linkedin", value: "Web Designer", locator: "linkedin:headline" },
      { source: "website", value: "Frontend Engineer", locator: "rahimdev.com · <h1>" },
    ],
    explanation: {
      en: "Three different titles make clients unsure what you actually do.",
      bn: "তিন জায়গায় তিন রকম পদবি দেখে ক্লায়েন্ট বুঝতে পারেন না আপনি আসলে কী করেন।",
    },
    suggested: "Web Developer (React & Shopify)",
  },
  {
    id: "c2",
    field: { en: "Dates at Pixel Studio", bn: "Pixel Studio-তে কাজের সময়" },
    severity: "major",
    values: [
      { source: "cv", value: "2021 – 2023", locator: "cv:line:18" },
      { source: "linkedin", value: "2022 – 2023", locator: "linkedin:experience[1]" },
    ],
    explanation: {
      en: "Recruiters notice date mismatches and may question your experience.",
      bn: "রিক্রুটাররা তারিখের অমিল লক্ষ করেন এবং আপনার অভিজ্ঞতা নিয়ে প্রশ্ন তুলতে পারেন।",
    },
    suggested: "Check your records and use the same years on both.",
  },
];
