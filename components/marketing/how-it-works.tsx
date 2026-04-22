import Image from "next/image";
import { CalendarCheck, HeartHandshake, UserPlus } from "lucide-react";
import { Reveal, TiltCard } from "@/components/marketing/motion";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your account",
    description:
      "New patients sign up once and keep their details ready for future visits, prescriptions, and follow-up care.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Choose the right appointment",
    description:
      "Browse availability, select a suitable time, and confirm care without unnecessary extra steps.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Come back with confidence",
    description:
      "Return to the same portal for prescriptions, payments, records, and video consultations whenever you need them.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Journey
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              A care journey that feels easy to return to.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The homepage now tells a clear story from first visit to ongoing
              care, which helps people understand the product before they choose
              sign up or login.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mb-12 overflow-hidden rounded-[2rem] border border-border/70 bg-white/72 p-6 shadow-[0_24px_70px_-52px_rgba(17,24,39,0.28)]">
            <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
              <div className="relative min-h-[15rem] overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(236,245,243,0.92),rgba(255,246,236,0.88))]">
                <div className="absolute inset-x-[16%] top-6 h-20 rounded-full bg-primary/18 blur-3xl" />
                <div className="absolute inset-x-[28%] bottom-4 h-16 rounded-full bg-accent/18 blur-3xl" />
                <Image
                  src="/image/site-internal-images/shine-doctor-prescribes-pills-1.png"
                  alt="Doctor guidance illustration"
                  fill
                  className="object-contain p-5 drop-shadow-[0_18px_32px_rgba(17,24,39,0.14)]"
                  sizes="(max-width: 768px) 100vw, 520px"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                  Human support
                </p>
                <h3 className="mt-3 text-2xl font-bold text-foreground">
                  Every step should feel guided, not rushed.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  The care story works better when people can imagine a real conversation, a clear decision, and a gentle follow-up instead of just forms and buttons.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Reveal key={step.number} delay={0.08 * index}>
                <TiltCard maxTilt={8}>
                  <div className="relative h-full rounded-[1.75rem] border border-border/70 bg-card/70 p-8 text-center shadow-[0_24px_70px_-56px_rgba(17,24,39,0.5)]">
                    {index < steps.length - 1 && (
                      <div className="absolute left-[calc(50%+4rem)] top-12 hidden h-px w-[calc(100%-8rem)] bg-gradient-to-r from-primary/35 to-border md:block" />
                    )}

                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-primary/5">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    <div className="mb-4 flex justify-center">
                      <span className="inline-flex min-w-14 items-center justify-center rounded-full border border-primary/15 bg-primary/6 px-3 py-1 text-sm font-semibold tracking-[0.18em] text-primary shadow-[0_12px_28px_-24px_rgba(61,122,122,0.45)]">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
