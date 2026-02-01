"use client";

import { useState, useCallback, useRef } from "react";
import type { MedicationSuggestion } from "@/lib/validations/ai-suggestions";

interface ExistingMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface UseMedicationSuggestionsOptions {
  appointmentId: string;
}

interface MedicationSuggestionsState {
  suggestions: MedicationSuggestion[];
  disclaimer: string | null;
  loading: boolean;
  error: string | null;
}

export function useMedicationSuggestions({
  appointmentId,
}: UseMedicationSuggestionsOptions) {
  const [state, setState] = useState<MedicationSuggestionsState>({
    suggestions: [],
    disclaimer: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (
      diagnosis: string,
      existingMedications: ExistingMedication[],
      symptoms?: string,
    ) => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        // Filter out empty/incomplete medications before sending
        const validMedications = existingMedications.filter(
          (med) =>
            med.medicineName.trim() &&
            med.dosage.trim() &&
            med.frequency.trim() &&
            med.duration.trim(),
        );

        const response = await fetch("/api/ai/medication-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diagnosis,
            appointmentId,
            existingMedications: validMedications,
            symptoms,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`,
          );
        }

        const data = await response.json();

        setState({
          suggestions: data.suggestions || [],
          disclaimer: data.disclaimer || null,
          loading: false,
          error: null,
        });

        return data.suggestions;
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch suggestions";

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        return [];
      }
    },
    [appointmentId],
  );

  const clearSuggestions = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      suggestions: [],
      disclaimer: null,
      loading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    suggestions: state.suggestions,
    disclaimer: state.disclaimer,
    loading: state.loading,
    error: state.error,
    fetchSuggestions,
    clearSuggestions,
    clearError,
  };
}
