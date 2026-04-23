"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BrandLockup } from "@/components/marketing/brand-lockup";
import { HoverLift } from "@/components/marketing/motion";
import { marketingNavLinks } from "@/components/marketing/routes";

export function MarketingNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.removeProperty("overflow");
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-[rgba(249,244,235,0.82)] backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <HoverLift y={-4}>
          <Link href="/" className="flex cursor-pointer items-center">
            <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ duration: 0.24 }}>
              <BrandLockup
                size="compact"
                className="rounded-3xl bg-transparent px-1 py-1"
              />
            </motion.div>
          </Link>
        </HoverLift>

        <div className="hidden items-center gap-2 lg:flex">
          {marketingNavLinks.map((link, index) => {
            const active = pathname === link.href;

            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
              >
                <Link
                  href={link.href}
                  className={`group relative inline-flex min-h-11 cursor-pointer items-center rounded-[1.1rem] px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "border border-primary/15 bg-primary/8 text-foreground"
                      : "border border-transparent text-muted-foreground hover:border-primary/10 hover:bg-white/72 hover:text-foreground"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute inset-x-4 bottom-1 h-px origin-left bg-primary transition-transform duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/login"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-foreground/35 bg-white/78 px-4 text-sm font-medium text-foreground shadow-[0_16px_36px_-34px_rgba(17,24,39,0.45)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground lg:min-h-13 lg:rounded-[1.25rem] lg:px-5"
            >
              Login
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-primary/35 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_18px_36px_-22px_rgba(61,122,122,0.95)] transition-all duration-300 hover:border-primary hover:bg-primary hover:shadow-[0_22px_40px_-20px_rgba(61,122,122,0.98)] lg:min-h-13 lg:rounded-[1.25rem] lg:px-5"
            >
              Sign up
            </Link>
          </motion.div>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[1.1rem] border border-primary/20 bg-white/82 text-foreground transition-colors hover:border-primary/35 hover:bg-white lg:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="marketing-mobile-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <div
        className={`lg:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`fixed inset-0 top-19 z-40 bg-black/35 transition-opacity duration-200 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <motion.div
          id="marketing-mobile-menu"
          initial={false}
          animate={{
            y: isMobileMenuOpen ? 0 : -12,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 right-0 top-full z-50 border-b border-primary/10 bg-[rgba(249,244,235,0.98)] px-4 pb-5 pt-3 shadow-[0_18px_40px_-30px_rgba(17,24,39,0.55)]"
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="mx-auto grid max-w-6xl gap-2">
            {marketingNavLinks.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex min-h-11 items-center rounded-[0.95rem] px-4 text-base font-medium transition-all duration-200 ${
                    active
                      ? "border border-primary/20 bg-primary/10 text-foreground"
                      : "border border-transparent text-muted-foreground hover:border-primary/10 hover:bg-white/80 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </header>
  );
}
