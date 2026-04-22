"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  DoorOpen,
  FileText,
  Fingerprint,
  LogIn,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Floating, HoverLift, Parallax } from "@/components/marketing/motion";

type IllustrationVariant = "features" | "journey" | "access" | "faq";

function IllustrationFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Parallax className="relative mx-auto w-full max-w-[32rem]">
      <Floating
        delay={0.2}
        className="absolute left-4 top-12 hidden rounded-2xl border border-white/60 bg-white/92 px-4 py-3 text-xs font-semibold text-primary shadow-[0_20px_60px_-36px_rgba(31,70,70,0.5)] md:block"
      >
        {label}
      </Floating>
      <Floating
        delay={0.75}
        className="absolute bottom-8 right-4 hidden rounded-2xl border border-white/60 bg-[#fff7ef] px-4 py-3 text-xs font-semibold text-[#7a5d46] shadow-[0_20px_60px_-36px_rgba(108,89,64,0.4)] md:block"
      >
        Premium motion
      </Floating>

      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,243,236,0.9))] p-6 shadow-[0_32px_90px_-48px_rgba(30,68,68,0.8)]">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(61,122,122,0.16),transparent_70%)]" />
        <div className="absolute -left-12 top-24 h-36 w-36 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
        {children}
      </div>
    </Parallax>
  );
}

function FeaturesHeroArt() {
  return (
    <IllustrationFrame label="Capability Map">
      <div className="relative grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[1.75rem] border border-border/70 bg-white/82 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Feature system
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground">
            Clear systems, premium feel
          </h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Feature depth should feel curated and elegant, not crowded or
            technical.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { icon: CalendarDays, label: "Appointments", value: "Live slots" },
              { icon: FileText, label: "Records", value: "Digital timeline" },
              { icon: ShieldCheck, label: "Privacy", value: "Protected access" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <HoverLift key={item.label} y={-6}>
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.label}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </HoverLift>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <HoverLift y={-7}>
            <div className="rounded-[1.75rem] border border-border/70 bg-[#0f5c58] p-5 text-white shadow-[0_20px_60px_-42px_rgba(15,92,88,0.65)]">
              <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/70">
                Live updates
              </p>
              <p className="mt-3 text-3xl font-semibold">06</p>
              <p className="mt-2 text-sm text-white/72">
                care signals designed to feel connected, not fragmented.
              </p>
            </div>
          </HoverLift>

          <div className="grid gap-4 sm:grid-cols-2">
            <HoverLift y={-7}>
              <div className="rounded-[1.5rem] border border-border/70 bg-white/84 p-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Premium clarity
                </p>
              </div>
            </HoverLift>
            <HoverLift y={-7}>
              <div className="rounded-[1.5rem] border border-border/70 bg-[#fff3e7] p-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3d0b8] text-[#7a5d46]">
                  <BellRing className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Helpful alerts
                </p>
              </div>
            </HoverLift>
          </div>
        </div>
      </div>
    </IllustrationFrame>
  );
}

function JourneyHeroArt() {
  return (
    <IllustrationFrame label="Journey Flow">
      <div className="relative rounded-[1.8rem] border border-border/70 bg-white/82 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Guided path
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-foreground">
          The experience feels guided
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Every step from sign up to follow-up reads like one connected care
          story.
        </p>

        <div className="relative mt-8 space-y-5">
          <div className="absolute bottom-2 left-6 top-2 w-px bg-gradient-to-b from-primary/50 via-primary/25 to-transparent" />
          {[
            { icon: UserPlus, title: "Create account", tone: "bg-primary/10 text-primary" },
            { icon: CalendarDays, title: "Book appointment", tone: "bg-secondary/80 text-primary" },
            { icon: Sparkles, title: "Return with confidence", tone: "bg-[#fff3e7] text-[#7a5d46]" },
          ].map((step, index) => {
            const Icon = step.icon;

            return (
              <HoverLift key={step.title} y={-7}>
                <div className="relative ml-2 flex items-start gap-4 rounded-[1.5rem] border border-border/60 bg-background/78 p-4">
                  <div
                    className={`relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${step.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Step 0{index + 1}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {step.title}
                    </p>
                  </div>
                </div>
              </HoverLift>
            );
          })}
        </div>

        <svg
          viewBox="0 0 520 120"
          className="mt-6 h-auto w-full"
          aria-hidden="true"
        >
          <path
            d="M30 66c42-18 75-18 115 0 44 20 82 22 128 6 36-12 66-18 98-10 19 4 39 11 71 29"
            fill="none"
            stroke="#0F5C58"
            strokeDasharray="8 10"
            strokeLinecap="round"
            strokeWidth="4"
            opacity=".35"
          />
        </svg>
      </div>
    </IllustrationFrame>
  );
}

function AccessHeroArt() {
  return (
    <IllustrationFrame label="Entry Design">
      <div className="grid gap-4 lg:grid-cols-2">
        <HoverLift y={-8}>
          <div className="rounded-[1.8rem] border border-primary/20 bg-primary/5 p-6 shadow-[0_18px_55px_-42px_rgba(31,70,70,0.35)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                New here
              </span>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-foreground">
              Sign up flow
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The first doorway should feel open, polished, and reassuring.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-white/85 p-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <DoorOpen className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Clear onboarding
              </p>
            </div>
          </div>
        </HoverLift>

        <HoverLift y={-8}>
          <div className="rounded-[1.8rem] border border-border/70 bg-white/82 p-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Returning
              </span>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-primary">
                <LogIn className="h-5 w-5" />
              </div>
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-foreground">
              Login flow
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Existing users should feel recognized and back in control quickly.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[1.35rem] border border-border/60 bg-background/78 p-4">
                <Fingerprint className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Trusted identity
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-border/60 bg-[#fff3e7] p-4">
                <ShieldCheck className="h-5 w-5 text-[#7a5d46]" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Private session
                </p>
              </div>
            </div>
          </div>
        </HoverLift>
      </div>
    </IllustrationFrame>
  );
}

function FAQHeroArt() {
  return (
    <IllustrationFrame label="Answer Layer">
      <div className="rounded-[1.8rem] border border-border/70 bg-white/82 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Answer design
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-foreground">
          Questions become part of the experience
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Helpful answers can still feel elevated when they use illustration,
          rhythm, and motion well.
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              icon: CircleHelp,
              title: "What happens after sign up?",
              tone: "bg-primary/10 text-primary",
            },
            {
              icon: ShieldCheck,
              title: "How is data protected?",
              tone: "bg-secondary/80 text-primary",
            },
            {
              icon: MessageSquareQuote,
              title: "How do consultations feel?",
              tone: "bg-[#fff3e7] text-[#7a5d46]",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <HoverLift key={item.title} y={-7}>
                <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Premium FAQ design should make clarity feel intentional.
                      </p>
                    </div>
                  </div>
                </div>
              </HoverLift>
            );
          })}
        </div>
      </div>
    </IllustrationFrame>
  );
}

export function PageIllustration({
  variant,
}: {
  variant: IllustrationVariant;
}) {
  switch (variant) {
    case "features":
      return <FeaturesHeroArt />;
    case "journey":
      return <JourneyHeroArt />;
    case "access":
      return <AccessHeroArt />;
    case "faq":
      return <FAQHeroArt />;
    default:
      return <FeaturesHeroArt />;
  }
}
