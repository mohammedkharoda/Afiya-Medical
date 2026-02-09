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
        console.log("Service Worker registered successfully:", registration);
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    register();
  }, []);

  return null;
}
