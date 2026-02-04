"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import {
  initializePusherBeams,
  subscribeToUserNotifications,
  subscribeToInterest,
  BEAMS_INSTANCE_ID,
} from "@/lib/pusher-beams";
import { useLoadingStore } from "@/stores/loading-store";

interface PusherBeamsProviderProps {
  children: React.ReactNode;
  userId?: string;
  userRole?: string;
}

// Validate instance ID format (should be a UUID-like string)
function isValidInstanceId(id: string): boolean {
  if (!id || id.length < 32) return false;
  return /^[a-f0-9-]{32,}$/i.test(id.replace(/-/g, ""));
}

export function PusherBeamsProvider({
  children,
  userId,
  userRole,
}: PusherBeamsProviderProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const initAttempted = useRef(false);

  // Get loading store action to notify when ready
  const setPusherBeamsReady = useLoadingStore(
    (state) => state.setPusherBeamsReady
  );

  // Check if instance ID is valid
  const isInstanceIdValid = isValidInstanceId(BEAMS_INSTANCE_ID);

  useEffect(() => {
    if (!sdkLoaded || !userId || initAttempted.current) return;

    // Mark initialization as attempted to prevent multiple tries
    initAttempted.current = true;

    const initBeams = async () => {
      try {
        const initialized = await initializePusherBeams();
        if (initialized && userId) {
          // Subscribe to user-specific notifications
          await subscribeToUserNotifications(userId);
          // Subscribe to general notifications
          await subscribeToUserNotifications("general");

          // Subscribe doctors to doctor-alerts channel
          if (userRole === "DOCTOR") {
            await subscribeToInterest("doctor-alerts");
          }
        }
      } catch {
        // Silently handle errors - push notifications are optional
      }
    };

    initBeams();
  }, [sdkLoaded, userId, userRole]);

  // Don't load the SDK if instance ID is not configured or invalid
  if (!BEAMS_INSTANCE_ID || !isInstanceIdValid) {
    // Mark as ready even without SDK (graceful degradation)
    useEffect(() => {
      setPusherBeamsReady(true);
    }, [setPusherBeamsReady]);

    return <>{children}</>;
  }

  return (
    <>
      <Script
        src="https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkLoaded(true);
          setPusherBeamsReady(true); // Notify loading store
        }}
        onError={() => {
          console.warn("Failed to load Pusher Beams SDK");
          setPusherBeamsReady(true); // Mark as ready even on error (optional feature)
        }}
      />
      {children}
    </>
  );
}
