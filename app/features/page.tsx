import { CTABanner } from "@/components/marketing/cta-banner";
import { FeaturesSection } from "@/components/marketing/features";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { MarketingRoutesGrid } from "@/components/marketing/routes-grid";

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        label="Features"
        title="Premium product depth with calm, modern presentation."
        description="This page isolates the feature story so the platform can feel polished, high-value, and easy to scan instead of crowded."
        variant="features"
        primaryHref="/register"
        primaryLabel="Sign up"
        secondaryHref="/access"
        secondaryLabel="See access paths"
      />
      <FeaturesSection />
      <MarketingRoutesGrid
        currentPath="/features"
        title="Keep exploring the rest of the marketing site"
        description="The product story now unfolds across dedicated pages instead of section jumps."
      />
      <CTABanner />
    </MarketingPageShell>
  );
}
