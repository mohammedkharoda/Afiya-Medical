import { eq } from "drizzle-orm";

import { db, doctorProfiles, patientProfiles, users } from "@/lib/db";

export interface DoctorReference {
  userId: string;
  publicId: string;
  name: string;
  email: string;
  phone: string | null;
  clinicAddress: string | null;
}

export interface PatientReference {
  profileId: string;
  userId: string;
  publicId: string;
  name: string;
  email: string;
  phone: string | null;
}

export async function getDoctorReferenceByUserId(
  doctorUserId: string,
): Promise<DoctorReference | null> {
  const doctor = await db
    .select({
      userId: users.id,
      publicId: doctorProfiles.publicId,
      name: users.name,
      email: users.email,
      phone: users.phone,
      clinicAddress: doctorProfiles.clinicAddress,
    })
    .from(users)
    .innerJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
    .where(eq(users.id, doctorUserId))
    .limit(1);

  return doctor[0] ?? null;
}

export async function getPatientReferenceByUserId(
  patientUserId: string,
): Promise<PatientReference | null> {
  const patient = await db
    .select({
      profileId: patientProfiles.id,
      userId: users.id,
      publicId: patientProfiles.publicId,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(patientProfiles)
    .innerJoin(users, eq(users.id, patientProfiles.userId))
    .where(eq(patientProfiles.userId, patientUserId))
    .limit(1);

  return patient[0] ?? null;
}

export async function getPatientReferenceByProfileId(
  patientProfileId: string,
): Promise<PatientReference | null> {
  const patient = await db
    .select({
      profileId: patientProfiles.id,
      userId: users.id,
      publicId: patientProfiles.publicId,
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(patientProfiles)
    .innerJoin(users, eq(users.id, patientProfiles.userId))
    .where(eq(patientProfiles.id, patientProfileId))
    .limit(1);

  return patient[0] ?? null;
}
