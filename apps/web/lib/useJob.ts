"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import type { Job } from "@/lib/types";

const POLL_MS = 1500;

interface State<R> {
  job: Job<R> | null;
  error: ApiError | null;
  loading: boolean;
}

/**
 * Loads a job and keeps polling while it (or a nested task) is still running.
 * `busy` lets callers keep polling for follow-up work, e.g. CV improvement.
 */
export function useJob<R>(path: string, busy?: (job: Job<R>) => boolean) {
  const [state, setState] = useState<State<R>>({ job: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const busyRef = useRef(busy);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const job = await api<Job<R>>(path);
        if (cancelled) return;
        setState({ job, error: null, loading: false });
        if (job.status === "running" || busyRef.current?.(job)) timer = setTimeout(load, POLL_MS);
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof ApiError ? err : new ApiError(0, "unknown", "Something went wrong.");
        setState((s) => ({ job: s.job, error, loading: false }));
        // Keep trying on transient failures while a job is in flight.
        if (error.retryable) timer = setTimeout(load, POLL_MS * 2);
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [path, tick]);

  return { ...state, refresh };
}
