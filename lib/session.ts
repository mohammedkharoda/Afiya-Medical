import { NextRequest } from "next/server";
import { db, sessions, users } from "./db";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import {
  isSessionExpiredForRole,
  getExtendedExpiryForRole,
  type UserRole,
} from "./session-utils";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  isVerified: boolean;
};

export type SessionData = {
  user: SessionUser;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
  };
};

/**
 * Get session from request with role-based expiry validation.
 * - Patients: 30 minutes strict expiry (no extension)
 * - Doctors: Session expires at end of day (midnight)
 * - Admins: 24 hours with sliding expiration (extends on activity)
 */
export async function getSession(
  req: NextRequest,
): Promise<SessionData | null> {
  // Try better-auth first
  try {
    const betterAuthSession = await auth.api.getSession({
      headers: req.headers,
    });
    if (betterAuthSession) {
      return betterAuthSession as unknown as SessionData;
    }
  } catch {
    // Fall through to manual lookup
  }

  // Manual lookup from cookie
  const cookieName = "better-auth.session_token";
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  // Find session in database
  const sessionRecord = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });

  if (!sessionRecord) {
    return null;
  }

  // Get user first to determine role
  const user = await db.query.users.findFirst({
    where: eq(users.id, sessionRecord.userId),
  });

  if (!user) {
    return null;
  }

  const userRole = (user.role || "PATIENT") as UserRole;

  // Check role-based session expiry
  // For patients: strict 30 minutes from creation (no extension)
  // For doctors: expires at end of day (no extension)
  // For admins: 24 hours with sliding expiration
  if (userRole === "PATIENT") {
    // Check if session is older than 30 minutes
    if (isSessionExpiredForRole(sessionRecord.createdAt, userRole)) {
      // Session expired for patient - delete it
      await db.delete(sessions).where(eq(sessions.id, sessionRecord.id));
      return null;
    }
  } else if (userRole === "DOCTOR") {
    // Doctors have end-of-day expiry (no sliding extension)
    if (sessionRecord.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, sessionRecord.id));
      return null;
    }
  } else {
    // Admins use sliding expiration
    if (sessionRecord.expiresAt < new Date()) {
      return null;
    }

    // Extend session on activity (only for admins)
    const newExpiry = getExtendedExpiryForRole(userRole);
    if (newExpiry) {
      await db
        .update(sessions)
        .set({ expiresAt: newExpiry, updatedAt: new Date() })
        .where(eq(sessions.id, sessionRecord.id));
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      userId: sessionRecord.userId,
      expiresAt: sessionRecord.expiresAt,
    },
  };
}
