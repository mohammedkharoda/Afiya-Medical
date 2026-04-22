import { CTABanner } from "@/components/marketing/cta-banner";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { MarketingRoutesGrid } from "@/components/marketing/routes-grid";

export default function JourneyPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        label="Journey"
        title="A care journey that feels premium, guided, and reassuring."
        description="Instead of burying the flow inside one long homepage, this route gives the user journey its own visual rhythm and illustration language."
        variant="journey"
        primaryHref="/register"
        primaryLabel="Start your account"
        secondaryHref="/features"
        secondaryLabel="Review features"
      />
      <HowItWorksSection />
      <MarketingRoutesGrid
        currentPath="/journey"
        title="See the other premium marketing pages"
        description="Each page focuses on one part of the product story with its own visual emphasis."
      />
      <CTABanner />
    </MarketingPageShell>
  );
}
