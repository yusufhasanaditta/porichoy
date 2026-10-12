"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

import bn from "@/messages/bn.json";
import en from "@/messages/en.json";

export type Lang = "en" | "bn";
export type Messages = typeof en;
type Theme = "light" | "dark";

const MESSAGES: Record<Lang, Messages> = { en, bn };
const LANG_KEY = "porichoy-lang";
const THEME_KEY = "porichoy-theme";

interface AppState {
  lang: Lang;
  m: Messages;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
  /** Format a number with Bangla digits when the UI is in Bangla. */
  num: (n: number) => string;
}

// --- Tiny external store for viewer preferences (localStorage + <html class="dark">) ---

const listeners = new Set<() => void>();
let langOverride: Lang | null = null; // used when localStorage is blocked

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the toggle still works for this visit.
  }
}

const getLang = (): Lang => langOverride ?? (readStorage(LANG_KEY) === "bn" ? "bn" : "en");
const getTheme = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

function toggleLang(): void {
  const next: Lang = getLang() === "en" ? "bn" : "en";
  langOverride = next;
  writeStorage(LANG_KEY, next);
  notify();
}

function toggleTheme(): void {
  const next: Theme = getTheme() === "light" ? "dark" : "light";
  document.documentElement.classList.toggle("dark", next === "dark");
  writeStorage(THEME_KEY, next);
  notify();
}

// --- Context ---

const AppContext = createContext<AppState | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getLang, () => "en" as const);
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as const);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<AppState>(
    () => ({
      lang,
      m: MESSAGES[lang],
      toggleLang,
      theme,
      toggleTheme,
      num: (n: number) => n.toLocaleString(lang === "bn" ? "bn-BD" : "en-US"),
    }),
    [lang, theme],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <Providers>");
  return ctx;
}

/** Runs before paint so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();`;
