DO $$
BEGIN
  CREATE TYPE "DoctorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "doctor_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "invitationId" text,
  "registrationNumber" text NOT NULL,
  "registrationCertificateUrl" text NOT NULL,
  "registrationCertificateName" text NOT NULL,
  "aadhaarCardUrl" text NOT NULL,
  "aadhaarCardName" text NOT NULL,
  "panCardUrl" text NOT NULL,
  "panCardName" text NOT NULL,
  "status" "DoctorVerificationStatus" DEFAULT 'PENDING' NOT NULL,
  "reviewNotes" text,
  "reviewedBy" text,
  "reviewedAt" timestamp,
  "submittedAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "doctor_verifications"
    ADD CONSTRAINT "doctor_verifications_userId_users_id_fk"
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "doctor_verifications"
    ADD CONSTRAINT "doctor_verifications_invitationId_doctor_invitations_id_fk"
    FOREIGN KEY ("invitationId") REFERENCES "public"."doctor_invitations"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "doctor_verifications"
    ADD CONSTRAINT "doctor_verifications_reviewedBy_users_id_fk"
    FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "doctor_verifications_user_id_idx"
  ON "doctor_verifications" USING btree ("userId");
