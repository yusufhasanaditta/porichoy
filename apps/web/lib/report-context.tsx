"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CvResult, Job, WebsiteResult } from "@/lib/types";

interface ReportState<R> {
  job: Job<R>;
  refresh: () => void;
}

const WebsiteCtx = createContext<ReportState<WebsiteResult> | null>(null);
const CvCtx = createContext<ReportState<CvResult> | null>(null);

export function WebsiteReportProvider({ value, children }: { value: ReportState<WebsiteResult>; children: ReactNode }) {
  return <WebsiteCtx.Provider value={value}>{children}</WebsiteCtx.Provider>;
}

export function CvReportProvider({ value, children }: { value: ReportState<CvResult>; children: ReactNode }) {
  return <CvCtx.Provider value={value}>{children}</CvCtx.Provider>;
}

export function useWebsiteReport(): ReportState<WebsiteResult> {
  const ctx = useContext(WebsiteCtx);
  if (!ctx) throw new Error("useWebsiteReport must be used inside the website report layout");
  return ctx;
}

export function useCvReport(): ReportState<CvResult> {
  const ctx = useContext(CvCtx);
  if (!ctx) throw new Error("useCvReport must be used inside the CV report layout");
  return ctx;
}
