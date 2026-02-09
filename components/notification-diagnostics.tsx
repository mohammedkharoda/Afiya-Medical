"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  initializePusherBeams,
  subscribeToUserNotifications,
  getDeviceInterests,
  BEAMS_INSTANCE_ID,
} from "@/lib/pusher-beams";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning";
  message: string;
}

export function NotificationDiagnostics({ userId }: { userId: string }) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        // Test notification
        new Notification("Afiya Notifications Enabled", {
          body: "You'll now receive appointment updates!",
          icon: "/web-app-manifest-192x192.png",
        });

        // Initialize Pusher Beams after permission granted
        await initializePusherBeams();
        await subscribeToUserNotifications(userId);

        runDiagnostics();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Check 1: Browser support
    if ("serviceWorker" in navigator && "PushManager" in window) {
      results.push({
        name: "Browser Support",
        status: "success",
        message: "Your browser supports push notifications",
      });
    } else {
      results.push({
        name: "Browser Support",
        status: "error",
        message: "Your browser doesn't support push notifications",
      });
    }

    // Check 2: Service Worker
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        results.push({
          name: "Service Worker",
          status: "success",
          message: `Service worker is registered (${registration.active ? "active" : "installing"})`,
        });
      } else {
        results.push({
          name: "Service Worker",
          status: "error",
          message: "Service worker is not registered",
        });
      }
    } catch (error) {
      results.push({
        name: "Service Worker",
        status: "error",
        message: "Failed to check service worker",
      });
    }

    // Check 3: Notification Permission
    const permission = Notification.permission;
    if (permission === "granted") {
      results.push({
        name: "Notification Permission",
        status: "success",
        message: "Notifications are allowed",
      });
    } else if (permission === "denied") {
      results.push({
        name: "Notification Permission",
        status: "error",
        message: "Notifications are blocked. Please enable them in browser settings.",
      });
    } else {
      results.push({
        name: "Notification Permission",
        status: "warning",
        message: "Notification permission not granted yet",
      });
    }

    // Check 4: Pusher Beams Configuration
    if (BEAMS_INSTANCE_ID) {
      results.push({
        name: "Pusher Beams Config",
        status: "success",
        message: `Instance ID configured: ${BEAMS_INSTANCE_ID.substring(0, 8)}...`,
      });
    } else {
      results.push({
        name: "Pusher Beams Config",
        status: "error",
        message: "Pusher Beams Instance ID not configured",
      });
    }

    // Check 5: Pusher SDK loaded
    if ((window as any).PusherPushNotifications) {
      results.push({
        name: "Pusher SDK",
        status: "success",
        message: "Pusher Beams SDK is loaded",
      });
    } else {
      results.push({
        name: "Pusher SDK",
        status: "error",
        message: "Pusher Beams SDK not loaded",
      });
    }

    // Check 6: Device interests
    try {
      const interests = await getDeviceInterests();
      if (interests.length > 0) {
        results.push({
          name: "Subscriptions",
          status: "success",
          message: `Subscribed to ${interests.length} channel(s): ${interests.join(", ")}`,
        });
      } else {
        results.push({
          name: "Subscriptions",
          status: "warning",
          message: "Not subscribed to any notification channels",
        });
      }
    } catch (error) {
      results.push({
        name: "Subscriptions",
        status: "error",
        message: "Failed to check subscriptions",
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const sendTestNotification = async () => {
    try {
      // Send browser notification
      if (Notification.permission === "granted") {
        new Notification("Test Notification", {
          body: "If you see this, notifications are working!",
          icon: "/web-app-manifest-192x192.png",
        });
      }

      // Call test API
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        alert("Test notification sent! Check your device.");
      } else {
        alert("Failed to send test notification. Check console for errors.");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      alert("Error sending test notification");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notification Diagnostics
        </CardTitle>
        <CardDescription>
          Check if push notifications are working on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            {notificationPermission === "granted" ? (
              <Bell className="h-6 w-6 text-green-600" />
            ) : (
              <BellOff className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Notification Status</p>
              <p className="text-sm text-muted-foreground">
                {notificationPermission === "granted" && "Enabled"}
                {notificationPermission === "denied" && "Blocked"}
                {notificationPermission === "default" && "Not configured"}
              </p>
            </div>
          </div>
          {notificationPermission !== "granted" && (
            <Button onClick={requestNotificationPermission} size="sm">
              Enable Notifications
            </Button>
          )}
        </div>

        {/* Run Diagnostics */}
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex-1"
            variant="outline"
          >
            {isRunning ? "Running..." : "Run Diagnostics"}
          </Button>
          <Button
            onClick={sendTestNotification}
            disabled={notificationPermission !== "granted"}
            variant="default"
          >
            Send Test
          </Button>
        </div>

        {/* Diagnostics Results */}
        {diagnostics.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Diagnostic Results:</h3>
            {diagnostics.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{result.name}</p>
                  <p className="text-xs text-muted-foreground break-words">
                    {result.message}
                  </p>
                </div>
                <Badge
                  variant={
                    result.status === "success"
                      ? "default"
                      : result.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">Troubleshooting:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Make sure notifications are enabled in browser settings</li>
            <li>• On iOS Safari, add the app to home screen first</li>
            <li>• Check if Pusher Beams credentials are configured</li>
            <li>• Try clearing browser cache and refreshing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
