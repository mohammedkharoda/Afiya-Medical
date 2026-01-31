import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI_MANUAL", "UPI_QR", "ONLINE"]),
  notes: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
