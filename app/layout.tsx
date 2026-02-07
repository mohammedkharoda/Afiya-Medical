import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppFooter } from "@/components/app-footer";
import { PwaRegister } from "@/components/pwa-register";
const mluvka = localFont({
  src: [
    {
      path: "../public/fonts/Mluvka/Mluvka-Regular-BF65518ac8463f5.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Mluvka/Mluvka-Medium-BF65518ac864edb.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Mluvka/Mluvka-Bold-BF65518ac8cff8c.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-mluvka",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#3d7a7a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Afiya Wellness - Doctor & Patient Portal",
  description: "Your trusted healthcare companion - Medical clinic management for appointments, prescriptions, and medical history",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Afiya Wellness",
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mluvka.variable} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </div>
        <PwaRegister />
        <Toaster position="top-right" richColors closeButton />
        <SpeedInsights />
      </body>
    </html>
  );
}
