"use client";

import { useEffect, useCallback, useRef } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseSessionValidatorOptions {
  /** Validation interval in milliseconds. Default: 60000 (1 minute) */
  intervalMs?: number;
  /** Callback when session expires */
  onExpired?: () => void;
  /** Whether to validate on window focus. Default: true */
  validateOnFocus?: boolean;
}

/**
 * Hook to periodically validate session and auto-logout when expired.
 * - Validates session against the server at specified intervals
 * - Validates when window regains focus
 * - Shows toast and redirects to login when session expires
 */
export function useSessionValidator(options: UseSessionValidatorOptions = {}) {
  const {
    intervalMs = 60000,
    onExpired,
    validateOnFocus = true,
  } = options;

  const router = useRouter();
  const isValidatingRef = useRef(false);

  const validateSession = useCallback(async () => {
    // Prevent concurrent validations
    if (isValidatingRef.current) return;
    isValidatingRef.current = true;

    try {
      const response = await fetch("/api/auth/validate-session", {
        credentials: "include",
      });

      if (response.status === 401) {
        // Session expired
        toast.warning("Your session has expired. Please log in again.", {
          duration: 5000,
        });
        await signOut();
        onExpired?.();
        router.push("/login?expired=true");
      }
    } catch (error) {
      // Network error - don't logout, just log
      console.error("Session validation error:", error);
    } finally {
      isValidatingRef.current = false;
    }
  }, [router, onExpired]);

  useEffect(() => {
    // Validate immediately on mount
    validateSession();

    // Set up interval for periodic validation
    const interval = setInterval(validateSession, intervalMs);

    // Validate when window regains focus
    const handleFocus = () => {
      if (validateOnFocus) {
        validateSession();
      }
    };

    // Validate when tab becomes visible
    const handleVisibilityChange = () => {
      if (validateOnFocus && document.visibilityState === "visible") {
        validateSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [validateSession, intervalMs, validateOnFocus]);

  return { validateSession };
}
