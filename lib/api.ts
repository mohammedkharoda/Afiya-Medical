import { NextRequest, NextResponse } from "next/server";
import { db, appointments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession, type SessionData } from "@/lib/session";
import { triggerAppointmentUpdate } from "@/lib/pusher";

export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export type RouteHandler = (
  req: NextRequest,
  session: SessionData,
  params: Record<string, string>,
) => Promise<NextResponse>;

/** Wrap a handler with session auth. Returns 401 if unauthenticated. */
export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    try {
      const session = await getSession(req);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const params = await context.params;
      return await handler(req, session, params);
    } catch (error) {
      console.error("Unhandled route error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/** Require one of the given roles. Returns 403 otherwise. */
export function requireRole(
  session: SessionData,
  ...roles: Role[]
): NextResponse | null {
  if (!roles.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Fetch an appointment with patient+user joined. Returns null if not found. */
export async function getAppointmentWithPatient(appointmentId: string) {
  return db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
    with: { patient: { with: { user: true } } },
  });
}

/** Fire-and-forget Pusher update — logs errors, never throws. */
export function fireAppointmentUpdate(appointment: {
  id: string;
  status: string;
  patientId: string;
}) {
  triggerAppointmentUpdate(appointment).catch((err) =>
    console.error("Pusher appointment update failed:", err),
  );
}

export function notFound(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
