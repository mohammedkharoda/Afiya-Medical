import type { NextConfig } from "next";
import withPWA from "next-pwa";

// Note: botid SDK requires additional Vercel configuration beyond Bot Management toggle
// Using Vercel's built-in Bot Management + HCaptcha for protection instead
// import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Ensure service worker is served with correct headers
  async headers() {
    return [
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

// Configure PWA
const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false, // We use custom registration in PwaRegister component
  skipWaiting: true,
  sw: "service-worker.js",
  scope: "/",
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
});

export default pwaConfig(nextConfig);
