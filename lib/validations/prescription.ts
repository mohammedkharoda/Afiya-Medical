import { z } from "zod";

export const medicationSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  diagnosis: z.string().min(5, "Diagnosis is required"),
  notes: z.string().optional(),
  followUpDate: z.date().optional(),
  medications: z
    .array(medicationSchema)
    .min(1, "At least one medication is required"),
});

export type MedicationInput = z.infer<typeof medicationSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
