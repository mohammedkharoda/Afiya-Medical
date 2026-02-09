"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          {
            scope: "/",
          }
        );
        console.log("✅ PWA Service Worker registered successfully");

        // Check for updates periodically
        if (registration) {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("🔄 New PWA update available");
                  // Optional: Show update notification to user
                }
              });
            }
          });
        }
      } catch (error) {
        console.error("❌ Service worker registration failed:", error);
      }
    };

    register();

    // Handle online/offline events
    const handleOnline = () => {
      console.log("🌐 Back online - syncing data");
    };

    const handleOffline = () => {
      console.log("📴 Offline mode activated");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
