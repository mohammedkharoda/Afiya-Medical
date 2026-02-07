export default function CopyrightPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Last updated: February 7, 2026
          </p>
          <h1 className="text-3xl font-bold text-foreground">Copyright</h1>
          <p className="text-muted-foreground">
            (c) 2026 Afiya Wellness. All rights reserved.
          </p>
        </div>

        <div className="mt-10 space-y-6 text-sm leading-6 text-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Ownership</h2>
            <p>
              All content, software, design, logos, and materials provided
              through the App are owned by Afiya Wellness or its licensors and
              are protected by intellectual property laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Permitted Use</h2>
            <p>
              You may use the App for your personal or professional healthcare
              activities as permitted by the Terms & Conditions. You may not
              copy, modify, distribute, or create derivative works without prior
              written consent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Trademarks</h2>
            <p>
              "Afiya Wellness" and associated marks are trademarks of Afiya
              Wellness. All other trademarks are the property of their
              respective owners.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Questions</h2>
            <p>
              For copyright questions, please contact support through the App.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
