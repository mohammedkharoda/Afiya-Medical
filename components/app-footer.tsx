import Link from "next/link";
import { BrandLockup } from "@/components/marketing/brand-lockup";

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
    <footer className="border-t border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.95fr_1fr]">
          <div className="space-y-4">
            <BrandLockup />
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              A secure doctor-patient portal for appointments, prescriptions,
              and medical records.
            </p>
            <p className="max-w-sm text-xs leading-6 text-muted-foreground">
              Not for emergencies. If you are experiencing a medical emergency,
              call your local emergency number.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
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
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
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
          <span>(c) {year} afiya. All rights reserved.</span>
          <span>Use of this app is subject to the Terms & Conditions.</span>
        </div>
      </div>
    </footer>
  );
}
