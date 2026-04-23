import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLockup } from "@/components/marketing/brand-lockup";
import { BrandIllustration } from "@/components/marketing/brand-illustration";
import { HoverLift, Reveal, TiltCard } from "@/components/marketing/motion";

const heroPoints = [
  "Book appointments without the usual back-and-forth",
  "Keep prescriptions, records, and payments in one place",
  "Move from in-person visits to video care with the same account",
];

const stats = [
  { value: "Same day", label: "appointment visibility when slots are open" },
  { value: "One portal", label: "for visits, prescriptions, and follow-up" },
  { value: "Less friction", label: "for patients starting their care journey" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 md:pt-20 lg:pb-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-[0_18px_45px_-28px_rgba(61,122,122,0.3)] backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              Wellness focused care
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-6 grid gap-4 rounded-[2rem] border border-primary/12 bg-white/68 p-4 shadow-[0_24px_54px_-40px_rgba(17,24,39,0.28)] backdrop-blur-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-5">
              <div className="w-fit">
                <BrandLockup showTagline />
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Afiya brings booking, follow-up, and medical clarity into one
                calm digital experience.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Healthcare that feels calmer from the very first click.
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Afiya Wellness gives patients a warm, secure place to sign up, book
              appointments, review prescriptions, and stay close to their care
              team without feeling lost in a complicated system.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <HoverLift y={-5}>
                <Link
                  href="/register"
                  className="inline-flex min-h-[3.5rem] min-w-[9.75rem] cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-primary/40 bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_22px_48px_-28px_rgba(61,122,122,0.95)] transition-all duration-300 hover:border-primary hover:bg-primary hover:shadow-[0_26px_54px_-26px_rgba(61,122,122,1)]"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Sign up
                </Link>
              </HoverLift>
              <HoverLift y={-5}>
                <Link
                  href="/login"
                  className="group inline-flex min-h-[3.5rem] min-w-[9.75rem] cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-foreground/45 bg-white/82 px-6 text-sm font-semibold text-foreground shadow-[0_18px_34px_-30px_rgba(17,24,39,0.3)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_22px_48px_-28px_rgba(61,122,122,0.9)]"
                >
                  Login
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </HoverLift>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap gap-3">
              {heroPoints.map((point, index) => (
                <HoverLift key={point} y={-4}>
                  <div
                    className="rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm text-muted-foreground shadow-[0_18px_40px_-36px_rgba(17,24,39,0.28)] backdrop-blur-sm"
                    style={{ transitionDelay: `${index * 30}ms` }}
                  >
                    {point}
                  </div>
                </HoverLift>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.36}>
            <div className="mt-14 grid gap-4 border-t border-border/70 pt-8 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-primary sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.42}>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <TiltCard maxTilt={7}>
                <div className="h-full rounded-[1.5rem] border border-primary/12 bg-white/76 p-4 shadow-[0_18px_55px_-42px_rgba(17,24,39,0.32)]">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Human-first flow
                  </p>
                </div>
              </TiltCard>
              <TiltCard maxTilt={7}>
                <div className="h-full rounded-[1.5rem] border border-primary/12 bg-white/76 p-4 shadow-[0_18px_55px_-42px_rgba(17,24,39,0.32)]">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-[#7a5d46]">
                    <Clock3 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Faster next steps
                  </p>
                </div>
              </TiltCard>
              <TiltCard maxTilt={7}>
                <div className="h-full rounded-[1.5rem] border border-primary/12 bg-white/76 p-4 shadow-[0_18px_55px_-42px_rgba(17,24,39,0.32)]">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Modern visual feel
                  </p>
                </div>
              </TiltCard>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <BrandIllustration />
        </Reveal>
      </div>
    </section>
  );
}
