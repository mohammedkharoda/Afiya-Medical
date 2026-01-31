DROP INDEX "doctor_schedule_day_of_week_idx";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "reminderSent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD COLUMN "scheduleDate" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD COLUMN "breakStartTime" text;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD COLUMN "breakEndTime" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "attachmentUrl" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "attachmentPublicId" text;--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_schedule_date_idx" ON "doctor_schedule" USING btree ("scheduleDate");--> statement-breakpoint
ALTER TABLE "doctor_schedule" DROP COLUMN "dayOfWeek";