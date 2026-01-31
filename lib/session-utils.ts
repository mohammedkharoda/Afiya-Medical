// Session utility functions for role-based session management
// Patients: 30 minutes absolute session (no extension)
// Doctors: Session expires at midnight (end of day)
// Admins: 24 hours with sliding expiration

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

// Session duration in seconds
export const SESSION_DURATIONS = {
  PATIENT: 60 * 30, // 30 minutes
  DOCTOR: 0, // Special: calculated dynamically to end of day
  ADMIN: 60 * 60 * 24, // 24 hours
} as const;

/**
 * Get session duration based on user role
 * @param role - User role
 * @returns Duration in seconds
 */
export function getSessionDurationByRole(role: UserRole): number {
  return SESSION_DURATIONS[role] || SESSION_DURATIONS.PATIENT;
}

/**
 * Get end-of-day expiry time (11:59:59 PM) for doctor sessions
 * @returns Date set to end of current day
 */
export function getDoctorEndOfDayExpiry(): Date {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Get session expiry date based on user role
 * - PATIENT: 30 minutes from now (absolute, no extension)
 * - DOCTOR: End of current day (11:59:59 PM)
 * - ADMIN: 24 hours from now (sliding expiration)
 * @param role - User role
 * @returns Expiry date
 */
export function getSessionExpiryByRole(role: UserRole): Date {
  const now = new Date();
  switch (role) {
    case "PATIENT":
      return new Date(now.getTime() + SESSION_DURATIONS.PATIENT * 1000);
    case "DOCTOR":
      return getDoctorEndOfDayExpiry();
    case "ADMIN":
      return new Date(now.getTime() + SESSION_DURATIONS.ADMIN * 1000);
    default:
      return new Date(now.getTime() + SESSION_DURATIONS.PATIENT * 1000);
  }
}

/**
 * Check if session is expired based on role-specific duration
 * @param createdAt - Session creation time
 * @param role - User role
 * @returns true if session is expired
 */
export function isSessionExpiredForRole(
  createdAt: Date,
  role: UserRole,
): boolean {
  const maxDuration = getSessionDurationByRole(role);
  const sessionAge = (Date.now() - createdAt.getTime()) / 1000; // in seconds
  return sessionAge > maxDuration;
}

/**
 * Calculate new expiry time for sliding session (admins only)
 * @param role - User role
 * @returns New expiry date, or null if no extension (patients and doctors)
 */
export function getExtendedExpiryForRole(role: UserRole): Date | null {
  // Only extend sessions for admins (sliding expiration)
  // Patients have absolute 30-minute sessions
  // Doctors have end-of-day sessions (no extension)
  if (role === "ADMIN") {
    return new Date(Date.now() + SESSION_DURATIONS.ADMIN * 1000);
  }
  return null;
}
