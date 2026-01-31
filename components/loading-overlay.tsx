"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { healthFacts } from "@/lib/health-facts";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
}

/**
 * Full-screen loading overlay
 * Shows pulsing logo (no shadow) with rotating health facts
 */
export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(() =>
    Math.floor(Math.random() * healthFacts.length)
  );
  const [showTimeout, setShowTimeout] = useState(false);
  const [factFade, setFactFade] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Set mounted flag on client-side only to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Rotate health facts every 4 seconds
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      // Fade out
      setFactFade(false);

      // Change fact after fade out
      setTimeout(() => {
        setCurrentFactIndex((prev) => (prev + 1) % healthFacts.length);
        setFactFade(true); // Fade in new fact
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Show timeout message after 10 seconds
  useEffect(() => {
    if (!isLoading) return;

    setShowTimeout(false); // Reset on mount/remount
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Don't render if not loading
  if (!isLoading) return null;

  const handleRetry = () => {
    // Reload the page to retry loading
    window.location.reload();
  };

  return (
    <div
      className="flex items-center justify-center min-h-[70vh]"
      role="status"
      aria-live="polite"
      aria-label="Loading your dashboard"
    >
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Pulsing Logo - No shadow */}
        <div className="relative">
          <Image
            src="https://res.cloudinary.com/dg2ezgumd/image/upload/v1769090131/logos_f96i4b.png"
            alt="Afiya Logo"
            width={80}
            height={80}
            className="rounded-xl animate-pulse-glow"
            priority
          />
        </div>

        {/* Health Fact with Fade Transition */}
        {mounted && (
          <p
            className={`max-w-md text-center text-base md:text-lg text-muted-foreground transition-opacity duration-300 ${
              factFade ? "opacity-100" : "opacity-0"
            }`}
          >
            {healthFacts[currentFactIndex]}
          </p>
        )}

        {/* Timeout Message and Retry Button */}
        {showTimeout && (
          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-sm text-muted-foreground">
              This is taking longer than expected...
            </p>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw size={16} />
              Retry
            </Button>
          </div>
        )}

        {/* Screen reader announcement */}
        <span className="sr-only">
          Loading your dashboard. Please wait while we prepare your personalized
          experience.
        </span>
      </div>
    </div>
  );
}
