import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { BrandLockup } from "@/components/marketing/brand-lockup";
import { NotFoundAnimation } from "@/components/not-found-animation";

export default function NotFoundPage() {
  return (
    <main className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,252,246,0.96),rgba(245,237,225,0.76)_48%,rgba(243,234,220,0.92)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:repeating-linear-gradient(0deg,rgba(61,122,122,0.04)_0_1px,transparent_1px_34px),repeating-linear-gradient(90deg,rgba(61,122,122,0.035)_0_1px,transparent_1px_34px)]"
      />

      <div className="mx-auto flex max-w-6xl justify-center pb-8">
        <BrandLockup className="rounded-[1.5rem] bg-white/60 px-4 py-3 shadow-[0_18px_45px_-38px_rgba(17,24,39,0.28)] backdrop-blur-sm" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[2.25rem] border border-primary/12 bg-white/72 p-6 shadow-[0_32px_90px_-52px_rgba(30,68,68,0.32)] backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
            Error 404
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            This page wandered off.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            The link may be outdated, the page may have moved, or the address
            might be incorrect. Let&apos;s get you back to something useful.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[1.35rem] border border-primary/35 bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_20px_45px_-28px_rgba(61,122,122,0.9)] transition-all duration-300 hover:border-primary hover:bg-primary hover:shadow-[0_24px_52px_-26px_rgba(61,122,122,1)]"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[1.35rem] border border-foreground/35 bg-white/82 px-6 text-sm font-semibold text-foreground shadow-[0_18px_34px_-30px_rgba(17,24,39,0.2)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="rounded-[2rem] border border-primary/12 bg-[linear-gradient(180deg,rgba(237,246,244,0.92),rgba(251,244,234,0.92))] p-4 shadow-[0_24px_60px_-40px_rgba(17,24,39,0.18)] sm:p-6">
            <NotFoundAnimation />
          </div>
        </div>
      </div>
    </main>
  );
}
