ALTER TABLE "appointments" ADD COLUMN "cancellationReason" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "cancelledAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "cancelledBy" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "originalAppointmentDate" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "originalAppointmentTime" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "rescheduledBy" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "rescheduledAt" timestamp;