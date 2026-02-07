import Link from "next/link";

const quickLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Copyright", href: "/copyright" },
];

const careLinks = [
  { label: "Patient Rights & Duties", href: "/terms#patient" },
  { label: "Doctor Responsibilities", href: "/terms#doctor" },
  { label: "Safety & Emergencies", href: "/terms#emergency" },
];

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white/70">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-lg font-semibold text-foreground">
              Afiya Wellness
            </p>
            <p className="text-sm text-muted-foreground">
              A secure doctor-patient portal for appointments, prescriptions,
              and medical records.
            </p>
            <p className="text-xs text-muted-foreground">
              Not for emergencies. If you are experiencing a medical emergency,
              call your local emergency number.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Care & Conduct
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {careLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>(c) {year} Afiya Wellness. All rights reserved.</span>
          <span>Use of this app is subject to the Terms & Conditions.</span>
        </div>
      </div>
    </footer>
  );
}
