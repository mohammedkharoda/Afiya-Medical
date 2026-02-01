ALTER TYPE "public"."AppointmentStatus" ADD VALUE 'PENDING' BEFORE 'SCHEDULED';--> statement-breakpoint
ALTER TYPE "public"."AppointmentStatus" ADD VALUE 'DECLINED' BEFORE 'RESCHEDULED';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "approvedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "approvedBy" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "declinedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "declinedBy" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "declineReason" text;