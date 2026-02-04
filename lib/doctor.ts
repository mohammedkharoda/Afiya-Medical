import { db, users, doctorProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";

interface DoctorInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  clinicAddress?: string | null;
}

export interface DoctorFullInfo extends DoctorInfo {
  speciality: string;
  upiId: string | null;
  clinicAddress: string | null;
}

let cachedDoctor: DoctorInfo | null = null;

/**
 * Fetches the doctor information from the database.
 * Results are cached to avoid repeated database queries.
 * Call clearDoctorCache() if doctor data is updated.
 * @deprecated Use getDoctorById for multi-doctor support
 */
export async function getDoctor(): Promise<DoctorInfo | null> {
  if (cachedDoctor) {
    return cachedDoctor;
  }

  const doctor = await db.query.users.findFirst({
    where: eq(users.role, "DOCTOR"),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (doctor) {
    const profile = await db.query.doctorProfiles.findFirst({
      where: eq(doctorProfiles.userId, doctor.id),
      columns: {
        clinicAddress: true,
      },
    });

    cachedDoctor = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      clinicAddress: profile?.clinicAddress || null,
    };
  }

  return cachedDoctor;
}

/**
 * Fetches doctor information by ID, including profile data (UPI, clinic address).
 * Use this for multi-doctor support.
 */
export async function getDoctorById(
  doctorId: string,
): Promise<DoctorFullInfo | null> {
  const doctor = await db.query.users.findFirst({
    where: eq(users.id, doctorId),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!doctor) {
    return null;
  }

  const profile = await db.query.doctorProfiles.findFirst({
    where: eq(doctorProfiles.userId, doctorId),
    columns: {
      speciality: true,
      upiId: true,
      clinicAddress: true,
    },
  });

  return {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    speciality: profile?.speciality || "General Physician",
    upiId: profile?.upiId || null,
    clinicAddress: profile?.clinicAddress || null,
  };
}

/**
 * Clears the cached doctor data.
 * Call this if doctor information is updated.
 */
export function clearDoctorCache(): void {
  cachedDoctor = null;
}
