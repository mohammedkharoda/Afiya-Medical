"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            You&apos;re Offline
          </h1>
          <p className="text-muted-foreground">
            It looks like you&apos;ve lost your internet connection. Please check
            your connection and try again.
          </p>
        </div>

        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <p className="text-xs text-muted-foreground">
          Some features may still be available offline.
        </p>
      </div>
    </div>
  );
}
