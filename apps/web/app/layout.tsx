import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Hind_Siliguri, Inter, JetBrains_Mono } from "next/font/google";

import { ApiStatus } from "@/components/ApiStatus";
import { FooterText } from "@/components/FooterText";
import { MobileNav, SiteHeader } from "@/components/SiteHeader";
import { Providers, themeScript } from "@/lib/providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const bangla = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Porichoy · পরিচয়",
  description:
    "Audit your CV, LinkedIn and website in one scan. Evidence for every finding, verified rewrites in your own voice, in English or Bangla.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a110f" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${bangla.variable} ${mono.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mb-16 border-t border-border md:mb-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6">
        <FooterText />
        <ApiStatus />
      </div>
    </footer>
  );
}
