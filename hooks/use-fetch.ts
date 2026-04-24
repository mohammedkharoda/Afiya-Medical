"use client";

import { useState, useEffect, useCallback } from "react";

interface UseFetchOptions {
  credentials?: RequestCredentials;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Simple data-fetching hook that handles the loading/error/data lifecycle
 * common across dashboard pages. Fetches on mount and on refetch().
 */
export function useFetch<T>(
  url: string,
  transform?: (raw: unknown) => T,
  options: UseFetchOptions = {},
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          credentials: options.credentials ?? "include",
        });
        const json = await res.json();
        if (!cancelled) {
          setData(transform ? transform(json) : (json as T));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Fetch failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick]);

  return { data, loading, error, refetch };
}
