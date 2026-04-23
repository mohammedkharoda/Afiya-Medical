import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { Reveal, TiltCard } from "@/components/marketing/motion";

const accessCards = [
  {
    title: "Create a new patient account",
    description:
      "Start here if you are new to Afiya Wellness and want to book care, store your details, and manage future visits in one place.",
    href: "/register",
    cta: "Go to sign up",
    icon: UserPlus,
    badge: "New patient",
    emphasized: true,
  },
  {
    title: "Return to your portal",
    description:
      "Use your existing account to review appointments, open prescriptions, check payments, or continue from a previous visit.",
    href: "/login",
    cta: "Go to login",
    icon: LogIn,
    badge: "Returning user",
    emphasized: false,
  },
];

export function CarePathsSection() {
  return (
    <section id="access" className="px-4 py-20 sm:px-6">
      <Reveal>
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-border/70 bg-card/75 p-8 shadow-[0_24px_80px_-56px_rgba(30,68,68,0.6)] backdrop-blur sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                Access
              </p>
              <h2 className="max-w-lg text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                A simple handoff from marketing page to product page.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                Visitors should not need to guess what comes next. This section
                guides them straight into the right product doorway: sign up if
                they are new, or login if they already have access.
              </p>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground shadow-[0_18px_40px_-34px_rgba(61,122,122,0.35)]">
                Patient registration is public. Existing patients and invited care
                team members can continue through secure login.
              </div>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-white/72 p-4 shadow-[0_18px_40px_-34px_rgba(17,24,39,0.22)]">
                <div className="relative h-40 w-full">
                  <div className="absolute inset-x-[18%] top-3 h-16 rounded-full bg-primary/16 blur-3xl" />
                  <div className="absolute inset-x-[28%] bottom-3 h-14 rounded-full bg-accent/16 blur-3xl" />
                  <Image
                    src="/image/site-internal-images/shine-first-aid-kit-with-pills-and-two-bottles-1.png"
                    alt="First aid kit and medicine illustration"
                    fill
                    className="object-contain p-2 drop-shadow-[0_18px_30px_rgba(17,24,39,0.12)]"
                    sizes="(max-width: 1024px) 100vw, 420px"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
              {accessCards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <Reveal key={card.title} delay={0.08 * (index + 1)}>
                    <TiltCard maxTilt={10}>
                      <div
                        className={`flex h-full flex-col rounded-[1.75rem] border p-6 shadow-[0_22px_70px_-54px_rgba(17,24,39,0.5)] transition-colors ${
                          card.emphasized
                            ? "border-primary/24 bg-primary/5 hover:border-primary/35"
                            : "border-border/70 bg-background/70 hover:border-primary/22"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="inline-flex min-h-10 items-center rounded-full border border-border/70 bg-background/88 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
                            {card.badge}
                          </div>
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                              card.emphasized
                                ? "border-primary/15 bg-primary text-primary-foreground"
                                : "border-primary/10 bg-card text-primary"
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>

                        <h3 className="mt-6 text-xl font-semibold text-foreground">
                          {card.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {card.description}
                        </p>

                        <Link
                          href={card.href}
                          className={`mt-auto inline-flex min-h-[3.25rem] items-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition-colors ${
                            card.emphasized
                              ? "border-primary/15 bg-primary text-primary-foreground hover:border-primary/25 hover:bg-primary/95"
                              : "border-border bg-card/88 text-foreground hover:border-primary/20 hover:bg-card"
                          }`}
                        >
                          {card.cta}
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
