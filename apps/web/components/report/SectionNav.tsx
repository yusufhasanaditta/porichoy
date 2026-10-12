"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  score?: number | null;
  badge?: number;
}

/** Section links: a wrapping pill grid on phones, a vertical list beside the content on desktop. */
export function SectionNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const { num } = useApp();
  return (
    <nav aria-label={label}>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-medium transition-colors duration-200",
                  active ? "bg-primary text-primary-fg" : "bg-surface text-fg hover:bg-surface-2 lg:bg-transparent",
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.score !== undefined && item.score !== null ? (
                  <span className={cn("shrink-0 text-xs tabular-nums", active ? "opacity-90" : "text-muted")}>{num(item.score)}</span>
                ) : null}
                {item.badge ? (
                  <span className={cn("shrink-0 rounded-full px-1.5 text-xs tabular-nums", active ? "bg-primary-fg/20" : "bg-surface-2")}>
                    {num(item.badge)}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
