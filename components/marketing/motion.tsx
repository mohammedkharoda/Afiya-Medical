"use client";

import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

type MotionChildrenProps = {
  children: ReactNode;
  className?: string;
};

type RevealProps = MotionChildrenProps & {
  delay?: number;
  distance?: number;
};

type HoverLiftProps = MotionChildrenProps & {
  y?: number;
};

type TiltCardProps = MotionChildrenProps & {
  maxTilt?: number;
};

export function MarketingScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.2,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-[linear-gradient(90deg,rgba(61,122,122,0.95),rgba(249,177,134,0.95),rgba(61,122,122,0.95))] shadow-[0_10px_30px_-12px_rgba(61,122,122,0.85)]"
      style={{ scaleX }}
    />
  );
}

export function MarketingBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yOne = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yTwo = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [0.95, 0.72, 0.5]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[linear-gradient(180deg,rgba(255,252,246,0.94),rgba(245,237,225,0.72)_48%,rgba(243,234,220,0.92)_100%)]"
    >
      <motion.div
        className="absolute inset-x-[-10%] top-[-12rem] h-[38rem] rounded-[48%_52%_56%_44%/58%_48%_52%_42%] bg-[radial-gradient(circle_at_top,rgba(61,122,122,0.22),rgba(61,122,122,0.05)_46%,transparent_72%)] blur-2xl"
        style={reduceMotion ? undefined : { y: yOne, opacity }}
      />
      <motion.div
        className="absolute left-[-8rem] top-[24rem] h-[28rem] w-[28rem] rounded-[53%_47%_42%_58%/52%_40%_60%_48%] bg-[radial-gradient(circle,rgba(94,168,162,0.18),transparent_66%)] blur-3xl"
        style={reduceMotion ? undefined : { y: yTwo }}
      />
      <motion.div
        className="absolute right-[-6rem] top-[38rem] h-[24rem] w-[24rem] rounded-[41%_59%_56%_44%/45%_56%_44%_55%] bg-[radial-gradient(circle,rgba(232,175,132,0.18),transparent_68%)] blur-3xl"
        style={reduceMotion ? undefined : { y: yOne }}
      />
      <div className="absolute left-[7%] top-32 h-52 w-52 rotate-[-7deg] rounded-[43%_57%_49%_51%/52%_41%_59%_48%] border border-primary/10" />
      <div className="absolute right-[9%] top-[28rem] h-44 w-64 rotate-[5deg] rounded-[58%_42%_54%_46%/40%_52%_48%_60%] border border-[#a07b45]/10" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_26%,rgba(255,255,255,0.03)_68%,rgba(61,122,122,0.04)_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(0deg,rgba(61,122,122,0.05)_0_1px,transparent_1px_34px),repeating-linear-gradient(90deg,rgba(61,122,122,0.04)_0_1px,transparent_1px_34px)] [background-position:center_center] [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(61,122,122,0.08)_0.8px,transparent_0.8px)] [background-position:0_0] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_86%,transparent)]" />
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 30,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
  y = -10,
}: HoverLiftProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={reduceMotion ? undefined : { y }}
      whileTap={reduceMotion ? undefined : { y: Math.min(y * 0.45, -2) }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({
  children,
  className,
  maxTilt = 8,
}: TiltCardProps) {
  const reduceMotion = useReducedMotion();
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const rotateX = useSpring(rotateXRaw, {
    stiffness: 160,
    damping: 18,
    mass: 0.4,
  });
  const rotateY = useSpring(rotateYRaw, {
    stiffness: 160,
    damping: 18,
    mass: 0.4,
  });
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(circle at ${x as number}% ${y as number}%, rgba(255,255,255,0.28), transparent 42%)`,
  );

  const glowOpacity = useTransform(
    [rotateXRaw, rotateYRaw],
    ([x, y]) => Math.min((Math.abs(x as number) + Math.abs(y as number)) / (maxTilt * 2), 1),
  );

  const handleMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    glowX.set(x);
    glowY.set(y);
    rotateYRaw.set(((x - 50) / 50) * maxTilt);
    rotateXRaw.set(((50 - y) / 50) * maxTilt);
  };

  const handleLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  return (
    <motion.div
      className={cn("relative transform-gpu [transform-style:preserve-3d]", className)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      whileTap={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={reduceMotion ? undefined : { rotateX, rotateY }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={
          reduceMotion
            ? undefined
            : {
                opacity: glowOpacity,
                background: glowBackground,
              }
        }
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function Floating({
  children,
  className,
  delay = 0,
}: MotionChildrenProps & { delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={
        reduceMotion
          ? undefined
          : {
              y: [0, -10, 0],
              rotate: [0, 1.2, 0],
            }
      }
      transition={{
        duration: 6.2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function Parallax({
  children,
  className,
}: MotionChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduceMotion ? undefined : { y }}
    >
      {children}
    </motion.div>
  );
}

export function MotionAccordion({
  question,
  answer,
  className,
}: {
  question: string;
  answer: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout
      className={cn(
        "rounded-[1.5rem] border border-border/70 bg-card/85 px-6 py-5 shadow-[0_18px_60px_-52px_rgba(17,24,39,0.45)]",
        className,
      )}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-foreground">{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.24 }}
          className="text-xl leading-none text-primary"
        >
          +
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={
          open
            ? { height: "auto", opacity: 1, marginTop: 16 }
            : { height: 0, opacity: 0, marginTop: 0 }
        }
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="text-sm leading-6 text-muted-foreground">{answer}</p>
      </motion.div>
    </motion.div>
  );
}
