ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "doctor_schedule" DROP CONSTRAINT "doctor_schedule_doctorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "patient_profiles" DROP CONSTRAINT "patient_profiles_preferredDoctorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "isVideoConsultation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "videoConsultationFee" double precision;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "depositAmount" double precision;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "depositPaid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "depositConfirmedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "depositVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "depositPaymentScreenshot" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "depositCancellationScheduledAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "videoMeetingUrl" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "videoMeetingId" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "videoMeetingPassword" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "videoMeetingCreatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "remainingAmount" double precision;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "remainingPaid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "remainingConfirmedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "remainingVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "remainingPaymentScreenshot" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "prescriptionWithheld" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD COLUMN "consultationFee" double precision DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "verifiedByDoctor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "verifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_preferredDoctorId_users_id_fk" FOREIGN KEY ("preferredDoctorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;