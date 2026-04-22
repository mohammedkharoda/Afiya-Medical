import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIllustration } from "@/components/marketing/page-illustration";
import { HoverLift, Reveal } from "@/components/marketing/motion";

export function MarketingPageHero({
  label,
  title,
  description,
  variant,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  label: string;
  title: string;
  description: string;
  variant: "features" | "journey" | "access" | "faq";
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <section className="px-4 pb-16 pt-16 sm:px-6 md:pt-24">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {label}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {title}
            </h1>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <HoverLift y={-6}>
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-[3.5rem] min-w-[9.75rem] cursor-pointer items-center justify-center rounded-[1.35rem] border border-primary/35 bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_20px_45px_-28px_rgba(61,122,122,0.9)] transition-all duration-300 hover:border-primary hover:bg-primary hover:shadow-[0_24px_52px_-26px_rgba(61,122,122,1)]"
                >
                  {primaryLabel}
                </Link>
              </HoverLift>
              <HoverLift y={-6}>
                <Link
                  href={secondaryHref}
                  className="inline-flex min-h-[3.5rem] min-w-[9.75rem] cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-foreground/45 bg-white/82 px-6 text-sm font-semibold text-foreground shadow-[0_18px_35px_-28px_rgba(17,24,39,0.28)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_22px_48px_-28px_rgba(61,122,122,0.9)]"
                >
                  {secondaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </HoverLift>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <PageIllustration variant={variant} />
        </Reveal>
      </div>
    </section>
  );
}
