"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  initializePusherBeams,
  subscribeToUserNotifications,
} from "@/lib/pusher-beams";

interface NotificationPermissionPromptProps {
  userId: string;
  userRole: string;
}

export function NotificationPermissionPrompt({
  userId,
  userRole,
}: NotificationPermissionPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = () => {
      // Don't show if not supported
      if (!("Notification" in window)) return false;

      const permission = Notification.permission;
      const dismissed = localStorage.getItem("notification-prompt-dismissed");

      // Show if permission is default (not asked yet) and not previously dismissed
      if (permission === "default" && !dismissed) {
        // Wait 5 seconds after page load before showing
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    checkPermission();
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // Show success notification
        new Notification("Notifications Enabled!", {
          body: "You'll now receive appointment updates and reminders",
          icon: "/web-app-manifest-192x192.png",
        });

        // Initialize Pusher Beams and subscribe
        await initializePusherBeams();
        await subscribeToUserNotifications(userId);

        if (userRole === "DOCTOR") {
          // Subscribe to doctor-specific channels
          const { subscribeToInterest } = await import("@/lib/pusher-beams");
          await subscribeToInterest("doctor-alerts");
        }

        setShowPrompt(false);
      } else if (permission === "denied") {
        alert(
          "Notifications are blocked. Please enable them in your browser settings."
        );
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      alert("Failed to enable notifications. Please try again.");
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + 7);
    localStorage.setItem("notification-prompt-dismissed", dismissedUntil.toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="rounded-lg border border-primary/20 bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">
              Enable Notifications
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get instant updates when doctors approve appointments, prescriptions
              are ready, and more.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isRequestingPermission}
                className="bg-primary hover:bg-primary/90"
              >
                {isRequestingPermission ? "Enabling..." : "Enable"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
