"use client";

import { useEffect, useState } from "react";

import { API_URL } from "@/lib/api";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";


type Status = "checking" | "online" | "offline";

/** Small live indicator that the FastAPI backend's /healthz is reachable. */
export function ApiStatus() {
  const { m } = useApp();
  const [status, setStatus] = useState<Status>("checking");
  const [version, setVersion] = useState<string | null>(null);
  const [ai, setAi] = useState<boolean | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    fetch(`${API_URL}/healthz`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { ok: boolean; version: string; ai?: boolean }) => {
        setStatus(body.ok ? "online" : "offline");
        setVersion(body.version);
        setAi(body.ai ?? null);
      })
      .catch(() => setStatus("offline"))
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  return (
    <span role="status" className="inline-flex items-center gap-2 text-xs text-muted">
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          status === "online" && "bg-success",
          status === "offline" && "bg-danger",
          status === "checking" && "animate-pulse bg-muted",
        )}
      />
      {m.api[status]}
      {version && status === "online" ? ` · v${version}` : null}
      {ai !== null && status === "online" ? ` · ${ai ? m.api.aiOn : m.api.aiOff}` : null}
    </span>
  );
}
