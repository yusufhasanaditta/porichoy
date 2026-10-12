"use client";

import { useEffect, useState } from "react";

import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Status = "checking" | "online" | "offline";

/** Small live indicator that the FastAPI backend's /healthz is reachable. */
export function ApiStatus() {
  const { m } = useApp();
  const [status, setStatus] = useState<Status>("checking");
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    fetch(`${API_URL}/healthz`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { ok: boolean; version: string }) => {
        setStatus(body.ok ? "online" : "offline");
        setVersion(body.version);
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
    </span>
  );
}
