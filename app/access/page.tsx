import { CTABanner } from "@/components/marketing/cta-banner";
import { CarePathsSection } from "@/components/marketing/care-paths";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { MarketingRoutesGrid } from "@/components/marketing/routes-grid";

export default function AccessPage() {
  return (
    <MarketingPageShell>
      <MarketingPageHero
        label="Access"
        title="Beautiful, low-friction entry points into the product."
        description="The access story now lives on its own route so sign up and login can feel more intentional, premium, and visually memorable."
        variant="access"
        primaryHref="/register"
        primaryLabel="Create account"
        secondaryHref="/login"
        secondaryLabel="Go to login"
      />
      <CarePathsSection />
      <MarketingRoutesGrid
        currentPath="/access"
        title="Continue through the rest of the site"
        description="The other pages carry the same premium language with their own focused illustrations and interaction design."
      />
      <CTABanner />
    </MarketingPageShell>
  );
}
