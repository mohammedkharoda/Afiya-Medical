import { CTABanner } from "@/components/marketing/cta-banner";
import { FAQSection } from "@/components/marketing/faq";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { MarketingRoutesGrid } from "@/components/marketing/routes-grid";

export default function FAQPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        label="FAQ"
        title="Answers that feel premium instead of purely utilitarian."
        description="This route gives the question-and-answer layer its own place in the marketing site, with better spacing, motion, and illustration-led storytelling."
        variant="faq"
        primaryHref="/register"
        primaryLabel="Sign up"
        secondaryHref="/features"
        secondaryLabel="View features"
      />
      <FAQSection />
      <MarketingRoutesGrid
        currentPath="/faq"
        title="Explore the rest of the route-based marketing site"
        description="Every route is now public, individually designed, and connected through a shared premium visual system."
      />
      <CTABanner />
    </MarketingPageShell>
  );
}
