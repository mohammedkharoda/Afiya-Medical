ALTER TABLE "doctor_profiles"
ADD COLUMN "publicId" text;

ALTER TABLE "patient_profiles"
ADD COLUMN "publicId" text;

UPDATE "doctor_profiles"
SET "publicId" = 'DOC-' || upper(substr(md5(id || clock_timestamp()::text || random()::text), 1, 10))
WHERE "publicId" IS NULL;

UPDATE "patient_profiles"
SET "publicId" = 'PAT-' || upper(substr(md5(id || clock_timestamp()::text || random()::text), 1, 10))
WHERE "publicId" IS NULL;

ALTER TABLE "doctor_profiles"
ALTER COLUMN "publicId" SET NOT NULL;

ALTER TABLE "patient_profiles"
ALTER COLUMN "publicId" SET NOT NULL;

CREATE UNIQUE INDEX "doctor_profiles_public_id_idx"
ON "doctor_profiles" USING btree ("publicId");

CREATE UNIQUE INDEX "patient_profiles_public_id_idx"
ON "patient_profiles" USING btree ("publicId");
