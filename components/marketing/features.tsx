import Image from "next/image";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Heart,
  ShieldCheck,
  Video,
} from "lucide-react";
import { HoverLift, Reveal, TiltCard } from "@/components/marketing/motion";

const features = [
  {
    icon: CalendarDays,
    title: "Calm appointment booking",
    description:
      "See available time slots, choose a doctor, and confirm visits without the friction of repeated calls or back-and-forth messaging.",
  },
  {
    icon: FileText,
    title: "Digital prescriptions",
    description:
      "Prescriptions remain easy to revisit after each appointment, so medication guidance is never hard to find.",
  },
  {
    icon: ClipboardList,
    title: "Medical history in one place",
    description:
      "Diagnoses, past visits, allergies, and notes live together in a timeline that feels organized instead of overwhelming.",
  },
  {
    icon: Video,
    title: "Video consultations",
    description:
      "Join remote consultations from the same portal, without pushing patients into extra tools or unfamiliar steps.",
  },
  {
    icon: CreditCard,
    title: "Flexible payments",
    description:
      "Handle cash, card, UPI, and online payments with a clear record attached to each appointment.",
  },
  {
    icon: Bell,
    title: "Helpful reminders",
    description:
      "Stay informed about visits, approvals, and care updates through notifications that support the journey without feeling noisy.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.84fr_1.16fr]">
        <Reveal>
          <div className="rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,rgba(61,122,122,0.1),rgba(255,255,255,0.56))] p-8 shadow-[0_24px_80px_-60px_rgba(30,68,68,0.55)]">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-primary">
              Features
            </p>
            <h2 className="max-w-md text-3xl font-bold text-foreground sm:text-4xl">
              Built for reassurance, not just efficiency.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              The product already supports real operational work. This marketing
              layer presents those capabilities with a wellness-first voice so the
              experience feels welcoming before people even sign in.
            </p>

            <div className="mt-8 space-y-4">
              <HoverLift y={-8}>
                <div className="rounded-2xl border border-border/70 bg-card/85 p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-semibold">Patient centered</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Warm copy and clear steps help reduce anxiety at the start of
                    care.
                  </p>
                </div>
              </HoverLift>

              <HoverLift y={-8}>
                <div className="rounded-2xl border border-border/70 bg-card/85 p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-sm font-semibold">Trust made visible</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Security, clarity, and continuity show up throughout the page,
                    not only in technical details.
                  </p>
                </div>
              </HoverLift>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-border/70 bg-white/80 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <HoverLift y={-8}>
                  <div className="rounded-2xl bg-primary/7 p-4">
                    <div className="relative mb-4 h-28 w-full overflow-hidden rounded-[1.25rem] bg-white/78">
                      <Image
                        src="/image/site-internal-images/pill-bottle-and-healthcare-icon.png"
                        alt="Medication support illustration"
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 100vw, 220px"
                      />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Connected care signals
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Appointment, prescription, payment, and reminder moments feel
                      tied together instead of scattered.
                    </p>
                  </div>
                </HoverLift>
                <HoverLift y={-8}>
                  <div className="rounded-2xl bg-[#fff5eb] p-4">
                    <div className="relative mb-4 h-28 w-full overflow-hidden rounded-[1.25rem] bg-white/78">
                      <Image
                        src="/image/site-internal-images/microscope-with-plant-specimen-in-beaker-biology-or-chemistry-education.png"
                        alt="Microscope and specimen illustration"
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 100vw, 220px"
                      />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Modern without coldness
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      The interface keeps a modern product feel while still reading
                      as health and wellness, not finance or enterprise software.
                    </p>
                  </div>
                </HoverLift>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal key={feature.title} delay={0.06 * (index % 3)}>
                <TiltCard maxTilt={9}>
                  <div className="h-full rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_18px_60px_-50px_rgba(17,24,39,0.45)]">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
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
