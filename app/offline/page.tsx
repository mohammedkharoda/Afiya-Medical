import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          You&apos;re Offline
        </h1>
        <p className="mb-6 text-muted-foreground">
          It looks like you&apos;re not connected to the internet. Please check
          your connection and try again.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="gap-2"
          size="lg"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            Some features may still be available offline. Once you&apos;re back
            online, your data will sync automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
