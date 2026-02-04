ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorId_users_id_fk";--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule" DROP CONSTRAINT "doctor_schedule_doctorId_users_id_fk";--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_doctorId_users_id_fk" FOREIGN KEY ("doctorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_profiles" DROP CONSTRAINT "patient_profiles_preferredDoctorId_users_id_fk";--> statement-breakpoint
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_preferredDoctorId_users_id_fk" FOREIGN KEY ("preferredDoctorId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
