"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMedicationSuggestions } from "@/hooks/use-medication-suggestions";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import type { MedicationSuggestion } from "@/lib/validations/ai-suggestions";

interface ExistingMedication {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface AIMedicationSuggestionsProps {
  appointmentId: string;
  diagnosis: string;
  existingMedications: ExistingMedication[];
  onAddMedication: (medication: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }) => void;
}

export function AIMedicationSuggestions({
  appointmentId,
  diagnosis,
  existingMedications,
  onAddMedication,
}: AIMedicationSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(
    new Set()
  );

  const {
    suggestions,
    disclaimer,
    loading,
    error,
    fetchSuggestions,
    clearSuggestions,
    clearError,
  } = useMedicationSuggestions({ appointmentId });

  const handleGetSuggestions = async () => {
    if (!diagnosis.trim()) {
      return;
    }
    setAddedSuggestions(new Set());
    await fetchSuggestions(diagnosis, existingMedications);
  };

  const handleAddMedication = (suggestion: MedicationSuggestion) => {
    onAddMedication({
      medicineName: suggestion.medicineName,
      dosage: suggestion.dosage,
      frequency: suggestion.frequency,
      duration: suggestion.duration,
      instructions: suggestion.instructions,
    });
    setAddedSuggestions((prev) => new Set([...prev, suggestion.medicineName]));
  };

  const handleClear = () => {
    clearSuggestions();
    setAddedSuggestions(new Set());
  };

  const isDiagnosisEmpty = !diagnosis.trim();

  return (
    <div className="border border-purple-200 rounded-lg bg-purple-50/50 overflow-hidden">
      {/* Header - Collapsible Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-900">
            AI Medication Assistant
          </span>
          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-purple-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Get Suggestions Button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetSuggestions}
              disabled={loading || isDiagnosisEmpty}
              className="border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Get AI Suggestions
                </>
              )}
            </Button>

            {suggestions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGetSuggestions}
                disabled={loading || isDiagnosisEmpty}
                className="text-purple-600 hover:text-purple-800"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}

            {suggestions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Context Info */}
          {isDiagnosisEmpty && (
            <p className="text-sm text-purple-600">
              Enter a diagnosis above to get AI-powered medication suggestions.
            </p>
          )}

          {!isDiagnosisEmpty && suggestions.length === 0 && !loading && !error && (
            <p className="text-sm text-purple-600">
              Based on: <strong>{diagnosis}</strong>
              {existingMedications.length > 0 && (
                <> + {existingMedications.length} medication(s) added</>
              )}
            </p>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-purple-800">
                Suggested medications:
              </p>
              {suggestions.map((suggestion, index) => {
                const isAdded = addedSuggestions.has(suggestion.medicineName);
                return (
                  <div
                    key={`${suggestion.medicineName}-${index}`}
                    className={`p-3 bg-white border rounded-lg ${
                      isAdded
                        ? "border-green-300 bg-green-50"
                        : "border-purple-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {suggestion.medicineName}{" "}
                          <span className="font-normal text-gray-600">
                            {suggestion.dosage}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {suggestion.frequency} for {suggestion.duration}
                        </p>
                        {suggestion.instructions && (
                          <p className="text-sm text-gray-500 italic">
                            {suggestion.instructions}
                          </p>
                        )}
                        <p className="text-xs text-purple-600 mt-1">
                          {suggestion.reason}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={isAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleAddMedication(suggestion)}
                        disabled={isAdded}
                        className={
                          isAdded
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "border-purple-300 text-purple-700 hover:bg-purple-100"
                        }
                      >
                        {isAdded ? (
                          "Added"
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Disclaimer */}
          {(suggestions.length > 0 || disclaimer) && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                {disclaimer ||
                  "AI suggestions are for reference only. Please verify all medications before prescribing."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
