"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareAppProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareApp({
  className,
  variant = "outline",
  size = "default",
}: ShareAppProps) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  const shareData = {
    title: "Afiya Wellness",
    text: "Access Afiya Wellness - Your trusted healthcare companion for appointments, prescriptions, and medical history.",
    url: appUrl,
  };

  const handleShare = async () => {
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success("Thanks for sharing!");
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== "AbortError") {
          // Fall back to copy
          handleCopy();
        }
      }
    } else {
      // Fall back to copy to clipboard
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          Share App
        </>
      )}
    </Button>
  );
}
