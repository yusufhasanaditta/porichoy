"use client";

import { CircleAlert, Info, TriangleAlert } from "lucide-react";

import type { Severity } from "@/lib/types";
import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const STYLE: Record<Severity, string> = {
  critical: "bg-danger-soft text-danger",
  major: "bg-warn-soft text-warn",
  minor: "bg-surface-2 text-muted",
};

const ICON = { critical: TriangleAlert, major: CircleAlert, minor: Info } as const;

/** Icon + text label, so severity never depends on color alone. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const { m } = useApp();
  const Icon = ICON[severity];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", STYLE[severity])}>
      <Icon className="size-3.5" aria-hidden="true" />
      {m.common.severity[severity]}
    </span>
  );
}
