import { z } from "zod";

export const medicalHistorySchema = z.object({
  conditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  surgeries: z.array(z.string()).default([]),
  familyHistory: z.string().optional(),
});

export type MedicalHistoryInput = z.infer<typeof medicalHistorySchema>;
