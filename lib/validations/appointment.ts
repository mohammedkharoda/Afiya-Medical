import { z } from "zod";

export const appointmentSchema = z.object({
  appointmentDate: z.date(),
  appointmentTime: z.string(),
  symptoms: z.string().min(10, "Please describe your symptoms in detail"),
  notes: z.string().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
