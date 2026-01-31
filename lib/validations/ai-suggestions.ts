import { z } from "zod";

export const existingMedicationSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
});

export const medicationSuggestionRequestSchema = z.object({
  diagnosis: z.string().min(1, "Diagnosis is required"),
  appointmentId: z.string().min(1, "Appointment ID is required"),
  existingMedications: z.array(existingMedicationSchema).default([]),
  symptoms: z.string().optional(),
});

export const medicationSuggestionSchema = z.object({
  medicineName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string(),
  reason: z.string(),
});

export const medicationSuggestionResponseSchema = z.object({
  suggestions: z.array(medicationSuggestionSchema),
  disclaimer: z.string(),
});

export type MedicationSuggestionRequest = z.infer<
  typeof medicationSuggestionRequestSchema
>;
export type MedicationSuggestionResponse = z.infer<
  typeof medicationSuggestionResponseSchema
>;
export type MedicationSuggestion = z.infer<typeof medicationSuggestionSchema>;
