"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import { BrandLockup } from "@/components/marketing/brand-lockup";
import { HoverLift, Parallax } from "@/components/marketing/motion";

const careSignals = [
  { icon: CalendarClock, title: "Fast booking", tone: "bg-primary/10 text-primary" },
  {
    icon: Stethoscope,
    title: "Doctor review",
    tone: "bg-[#fbe7d7] text-[#7a5d46]",
  },
  { icon: CheckCircle2, title: "Clear follow-up", tone: "bg-secondary/80 text-primary" },
];

export function BrandIllustration() {
  return (
    <Parallax className="relative mx-auto w-full max-w-[35rem]">
      <motion.div
        className="relative overflow-hidden rounded-[2.25rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,242,232,0.93))] p-6 shadow-[0_32px_90px_-48px_rgba(30,68,68,0.62)]"
        whileHover={{ rotate: -0.8, y: -6 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(61,122,122,0.16),transparent_70%)]" />
        <div className="absolute inset-[14px] rounded-[1.9rem] border border-primary/10" />

        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-background/82 px-4 py-3 shadow-[0_12px_32px_-28px_rgba(17,24,39,0.4)]">
          <div className="flex items-center gap-3">
            <BrandLockup size="compact" />
            <p className="text-sm font-semibold text-foreground">Doctor-led care that still feels warm</p>
          </div>
          <motion.div
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            animate={{ boxShadow: ["0 0 0 rgba(61,122,122,0)", "0 0 0 8px rgba(61,122,122,0.08)", "0 0 0 rgba(61,122,122,0)"] }}
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            Live
          </motion.div>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[1.9rem] border border-primary/12 bg-[#f8f4ec] p-5">
          <div className="absolute inset-[10px] rounded-[1.35rem] border border-[#a07b45]/10" />
          <motion.div
            className="relative overflow-hidden rounded-[1.7rem] border border-primary/12 bg-[linear-gradient(180deg,#edf6f4_0%,#fbf4ea_100%)] p-6"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-x-[12%] top-16 h-40 rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute inset-x-[24%] bottom-10 h-28 rounded-full bg-accent/16 blur-3xl" />
            <div className="absolute left-6 top-6 rounded-full bg-white/88 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary shadow-[0_12px_30px_-24px_rgba(17,24,39,0.35)]">
              Trusted care
            </div>
            <div className="absolute right-6 top-6 rounded-full bg-white/88 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#7a5d46] shadow-[0_12px_30px_-24px_rgba(17,24,39,0.35)]">
              Human support
            </div>

            <div className="relative mx-auto flex min-h-[28rem] w-full items-end justify-center pt-12">
              <Image
                src="/image/site-internal-images/ai-brain-2.gif"
                alt="Animated mind illustration"
                width={900}
                height={900}
                unoptimized
                className="h-auto max-h-[29rem] w-full object-contain object-center drop-shadow-[0_24px_40px_rgba(61,122,122,0.16)]"
                sizes="(max-width: 768px) 80vw, 32rem"
                priority
              />
            </div>
          </motion.div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {careSignals.map((signal) => {
              const Icon = signal.icon;

              return (
                <HoverLift key={signal.title} y={-8}>
                  <div className="rounded-2xl border border-primary/12 bg-white/82 p-3 text-left shadow-[0_16px_45px_-36px_rgba(17,24,39,0.3)]">
                    <div
                      className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${signal.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {signal.title}
                    </p>
                  </div>
                </HoverLift>
              );
            })}
          </div>
        </div>
      </motion.div>
    </Parallax>
  );
}
