"use client";

import { useApp } from "@/lib/providers";

export function FooterText() {
  const { m } = useApp();
  return <p>{m.footer}</p>;
}
