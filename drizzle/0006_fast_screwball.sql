CREATE TABLE "doctor_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"speciality" text NOT NULL,
	"degrees" text[] DEFAULT '{}' NOT NULL,
	"experience" integer,
	"upiId" text NOT NULL,
	"upiQrCode" text,
	"clinicAddress" text,
	"bio" text,
	"isTestAccount" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
DROP INDEX "doctor_schedule_date_idx";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "doctorId" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "billSent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "billSentAt" timestamp;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "prescriptionSent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "prescriptionSentAt" timestamp;--> statement-breakpoint
ALTER TABLE "doctor_invitations" ADD COLUMN "isTestAccount" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD COLUMN "doctorId" text;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD COLUMN "preferredDoctorId" text;--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_profiles_user_id_idx" ON "doctor_profiles" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_preferredDoctorId_users_id_fk" FOREIGN KEY ("preferredDoctorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_schedule_doctor_date_idx" ON "doctor_schedule" USING btree ("doctorId","scheduleDate");