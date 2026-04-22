import type { ReactNode } from "react";
import {
  MarketingBackdrop,
  MarketingScrollProgress,
} from "@/components/marketing/motion";
import { MarketingNavbar } from "@/components/marketing/navbar";

export function MarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingScrollProgress />
      <MarketingNavbar />
      <main className="relative isolate overflow-hidden bg-[linear-gradient(180deg,rgba(255,252,247,0.88),rgba(246,239,228,0.72)_48%,rgba(243,234,220,0.86)_100%)]">
        <MarketingBackdrop />
        {children}
      </main>
    </>
  );
}
