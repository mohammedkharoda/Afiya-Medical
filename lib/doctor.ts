import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

interface DoctorInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

let cachedDoctor: DoctorInfo | null = null;

/**
 * Fetches the doctor information from the database.
 * Results are cached to avoid repeated database queries.
 * Call clearDoctorCache() if doctor data is updated.
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
    cachedDoctor = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
    };
  }

  return cachedDoctor;
}

/**
 * Clears the cached doctor data.
 * Call this if doctor information is updated.
 */
export function clearDoctorCache(): void {
  cachedDoctor = null;
}
