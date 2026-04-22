import Link from "next/link";
import { ArrowRight, CalendarCheck, LogIn } from "lucide-react";
import { HoverLift, Reveal } from "@/components/marketing/motion";

export function CTABanner() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#2d7471_0%,#3e7b76_42%,#9b7d45_100%)] px-8 py-16 text-center shadow-[0_32px_90px_-52px_rgba(30,68,68,0.95)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />

          <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
            Ready to move from interest to action?
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-white/78">
            The next step is clear now: create a patient account if you are new,
            or log in if you already use Afiya Wellness.
          </p>

          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <HoverLift y={-6}>
              <Link
                href="/register"
                className="inline-flex min-h-[3.5rem] min-w-[9.75rem] cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-white/75 bg-white px-6 text-sm font-semibold text-primary shadow-[0_22px_40px_-22px_rgba(255,255,255,0.6)] transition-all duration-300 hover:border-white hover:bg-white hover:shadow-[0_24px_42px_-20px_rgba(255,255,255,0.7)]"
              >
                <CalendarCheck className="h-4 w-4" />
                Sign up
              </Link>
            </HoverLift>
            <HoverLift y={-6}>
              <Link
                href="/login"
                className="group inline-flex min-h-[3.5rem] min-w-[9.75rem] cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-white/55 bg-white/16 px-6 text-sm font-semibold text-white transition-all duration-300 hover:border-[#143f44] hover:bg-[#143f44] hover:shadow-[0_24px_42px_-20px_rgba(20,63,68,0.55)]"
              >
                <LogIn className="h-4 w-4 transition-colors duration-300 group-hover:text-white" />
                <span className="transition-colors duration-300 group-hover:text-white">
                  Login
                </span>
                <ArrowRight className="h-4 w-4 transition-colors duration-300 group-hover:text-white" />
              </Link>
            </HoverLift>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
