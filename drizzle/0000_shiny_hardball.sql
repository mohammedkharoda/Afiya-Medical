CREATE TYPE "public"."AppointmentStatus" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."DocumentType" AS ENUM('REPORT', 'XRAY', 'SCAN', 'PRESCRIPTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."Gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('APPOINTMENT_CONFIRMATION', 'APPOINTMENT_REMINDER', 'PRESCRIPTION_READY', 'PAYMENT_RECEIVED', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."PaymentMethod" AS ENUM('CASH', 'CARD', 'UPI_MANUAL', 'UPI_QR', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('PENDING', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('PATIENT', 'DOCTOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"patientId" text NOT NULL,
	"appointmentDate" timestamp NOT NULL,
	"appointmentTime" text NOT NULL,
	"status" "AppointmentStatus" DEFAULT 'SCHEDULED' NOT NULL,
	"symptoms" text NOT NULL,
	"notes" text,
	"paymentStatus" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"dayOfWeek" integer NOT NULL,
	"startTime" text NOT NULL,
	"endTime" text NOT NULL,
	"slotDuration" integer NOT NULL,
	"maxPatientsPerSlot" integer DEFAULT 1 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"patientId" text NOT NULL,
	"documentType" "DocumentType" NOT NULL,
	"fileUrl" text NOT NULL,
	"fileName" text NOT NULL,
	"description" text,
	"uploadedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_history" (
	"id" text PRIMARY KEY NOT NULL,
	"patientId" text NOT NULL,
	"conditions" text[] DEFAULT '{}' NOT NULL,
	"allergies" text[] DEFAULT '{}' NOT NULL,
	"currentMedications" text[] DEFAULT '{}' NOT NULL,
	"surgeries" text[] DEFAULT '{}' NOT NULL,
	"familyHistory" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" text PRIMARY KEY NOT NULL,
	"prescriptionId" text NOT NULL,
	"medicineName" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"duration" text NOT NULL,
	"instructions" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "NotificationType" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"dob" timestamp NOT NULL,
	"gender" "Gender" NOT NULL,
	"bloodGroup" text,
	"address" text NOT NULL,
	"emergencyContact" text NOT NULL,
	"hasCompletedMedicalHistory" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"appointmentId" text NOT NULL,
	"amount" double precision NOT NULL,
	"paymentMethod" "PaymentMethod" NOT NULL,
	"status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"paidAt" timestamp,
	"notes" text,
	"paymentScreenshot" text,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"appointmentId" text NOT NULL,
	"diagnosis" text NOT NULL,
	"notes" text,
	"followUpDate" timestamp,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"password" text,
	"role" "Role" DEFAULT 'PATIENT' NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"image" text,
	"isVerified" boolean DEFAULT false NOT NULL,
	"verificationToken" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_patient_profiles_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patient_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_patientId_patient_profiles_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patient_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_patientId_patient_profiles_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."patient_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_prescriptionId_prescriptions_id_fk" FOREIGN KEY ("prescriptionId") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointmentId_appointments_id_fk" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointmentId_appointments_id_fk" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_schedule_day_of_week_idx" ON "doctor_schedule" USING btree ("dayOfWeek");--> statement-breakpoint
CREATE UNIQUE INDEX "medical_history_patient_id_idx" ON "medical_history" USING btree ("patientId");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_profiles_user_id_idx" ON "patient_profiles" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_appointment_id_idx" ON "payments" USING btree ("appointmentId");--> statement-breakpoint
CREATE UNIQUE INDEX "prescriptions_appointment_id_idx" ON "prescriptions" USING btree ("appointmentId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");