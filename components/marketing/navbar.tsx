"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BrandLockup } from "@/components/marketing/brand-lockup";
import { HoverLift } from "@/components/marketing/motion";
import { marketingNavLinks } from "@/components/marketing/routes";

export function MarketingNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-[rgba(249,244,235,0.82)] backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <HoverLift y={-4}>
          <Link href="/" className="flex cursor-pointer items-center">
            <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ duration: 0.24 }}>
              <BrandLockup
                size="compact"
                className="rounded-[1.5rem] bg-transparent px-1 py-1"
              />
            </motion.div>
          </Link>
        </HoverLift>

        <div className="hidden items-center gap-2 md:flex">
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
              className="inline-flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-[1.25rem] border border-foreground/35 bg-white/78 px-5 text-sm font-medium text-foreground shadow-[0_16px_36px_-34px_rgba(17,24,39,0.45)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Login
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="inline-flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-[1.25rem] border border-primary/35 bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_18px_36px_-22px_rgba(61,122,122,0.95)] transition-all duration-300 hover:border-primary hover:bg-primary hover:shadow-[0_22px_40px_-20px_rgba(61,122,122,0.98)]"
            >
              Sign up
            </Link>
          </motion.div>
        </div>
      </nav>
    </header>
  );
}
