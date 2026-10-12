"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Languages, LayoutDashboard, Moon, ScanSearch, Sun } from "lucide-react";

import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

function useNavItems() {
  const { m } = useApp();
  const pathname = usePathname();
  return [
    { href: "/", label: m.nav.home, icon: House },
    { href: "/scan/new", label: m.nav.newScan, icon: ScanSearch },
    { href: "/dashboard", label: m.nav.dashboard, icon: LayoutDashboard },
  ].map((item) => ({
    ...item,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  }));
}

export function SiteHeader() {
  const { m, lang, toggleLang, theme, toggleTheme } = useApp();
  const items = useNavItems();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        {m.nav.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Porichoy">
          <Logo className="size-8 shrink-0" />
          <span className="text-lg font-bold tracking-tight">
            Porichoy <span className="hidden font-medium text-muted sm:inline">· পরিচয়</span>
          </span>
        </Link>

        <nav aria-label={m.nav.main} className="hidden items-center gap-1 md:flex">
          {items.map(({ href, label, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleLang} aria-label={m.nav.langLabel} className={buttonClass("ghost", "px-3")}>
            <Languages className="size-4" aria-hidden="true" />
            <span lang={lang === "en" ? "bn" : "en"}>{m.nav.langShort}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? m.nav.themeDark : m.nav.themeLight}
            className={buttonClass("ghost", "w-11 px-0")}
          >
            {theme === "light" ? <Moon className="size-5" aria-hidden="true" /> : <Sun className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar for phones; the header nav takes over from the md breakpoint. */
export function MobileNav() {
  const { m } = useApp();
  const items = useNavItems();

  return (
    <nav
      aria-label={m.nav.main}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-200",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
