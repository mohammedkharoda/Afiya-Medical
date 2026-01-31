-- Add break time fields to doctor_schedule table
ALTER TABLE "doctor_schedule" ADD COLUMN IF NOT EXISTS "breakStartTime" text;
ALTER TABLE "doctor_schedule" ADD COLUMN IF NOT EXISTS "breakEndTime" text;
