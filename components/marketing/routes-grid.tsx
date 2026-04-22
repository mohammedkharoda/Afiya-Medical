import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, TiltCard } from "@/components/marketing/motion";
import { marketingRouteCards } from "@/components/marketing/routes";

export function MarketingRoutesGrid({
  title = "Explore the marketing site",
  description = "Each route now has its own visual identity, motion, and illustration system.",
  currentPath,
}: {
  title?: string;
  description?: string;
  currentPath?: string;
}) {
  const cards = currentPath
    ? marketingRouteCards.filter((card) => card.href !== currentPath)
    : marketingRouteCards;

  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Routes
            </p>
            <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-muted-foreground">{description}</p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <Reveal key={card.href} delay={0.05 * index}>
                <TiltCard maxTilt={9}>
                  <Link
                    href={card.href}
                    className="group relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/80 p-6 shadow-[0_22px_70px_-54px_rgba(17,24,39,0.46)]"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`}
                    />
                    <div className="relative flex h-full flex-col">
                      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-[0_18px_40px_-30px_rgba(17,24,39,0.3)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                        {card.label}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold text-foreground">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {card.description}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
                        Open page
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
