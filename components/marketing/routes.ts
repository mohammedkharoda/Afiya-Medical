import {
  Activity,
  CircleHelp,
  Compass,
  DoorOpen,
  Home,
} from "lucide-react";

export const marketingNavLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Features", href: "/features", icon: Activity },
  { label: "Journey", href: "/journey", icon: Compass },
  { label: "Access", href: "/access", icon: DoorOpen },
  { label: "FAQ", href: "/faq", icon: CircleHelp },
];

export const marketingRouteCards = [
  {
    label: "Features",
    href: "/features",
    title: "Capability-rich care orchestration",
    description:
      "Appointments, prescriptions, history, notifications, and payments presented with premium clarity.",
    accent: "from-primary/20 via-primary/5 to-transparent",
    icon: Activity,
  },
  {
    label: "Journey",
    href: "/journey",
    title: "A patient experience that feels guided",
    description:
      "From first sign up to returning after treatment, each moment feels connected and understandable.",
    accent: "from-[#f3c7ad]/25 via-[#fff1e5] to-transparent",
    icon: Compass,
  },
  {
    label: "Access",
    href: "/access",
    title: "Clear doorways into the product",
    description:
      "Separate sign up and login paths reduce hesitation and help visitors choose the right next step fast.",
    accent: "from-secondary/40 via-secondary/10 to-transparent",
    icon: DoorOpen,
  },
  {
    label: "FAQ",
    href: "/faq",
    title: "Practical answers with less friction",
    description:
      "Common questions become part of the premium product story instead of a dry afterthought.",
    accent: "from-primary/15 via-accent/10 to-transparent",
    icon: CircleHelp,
  },
];
