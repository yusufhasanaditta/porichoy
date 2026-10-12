"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { buttonClass } from "@/components/ui";
import { useApp } from "@/lib/providers";

export function CopyButton({ text, label, variant = "secondary" }: { text: string; label?: string; variant?: "primary" | "secondary" | "ghost" }) {
  const { m } = useApp();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className={buttonClass(variant)} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {copied ? m.common.copied : (label ?? m.common.copy)}
    </button>
  );
}
