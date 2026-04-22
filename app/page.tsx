import { CTABanner } from "@/components/marketing/cta-banner";
import { CarePathsSection } from "@/components/marketing/care-paths";
import { FAQSection } from "@/components/marketing/faq";
import { FeaturesSection } from "@/components/marketing/features";
import { HeroSection } from "@/components/marketing/hero";
import { HowItWorksSection } from "@/components/marketing/how-it-works";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { MarketingRoutesGrid } from "@/components/marketing/routes-grid";

export default function Home() {
  return (
    <MarketingPageShell>
      <HeroSection />
      <MarketingRoutesGrid
        title="Explore a more premium route-based marketing experience"
        description="The navigation now leads to dedicated pages instead of section anchors, so each story gets more room for visuals, copy, and motion."
      />
      <FeaturesSection />
      <HowItWorksSection />
      <CarePathsSection />
      <FAQSection />
      <CTABanner />
    </MarketingPageShell>
  );
}
