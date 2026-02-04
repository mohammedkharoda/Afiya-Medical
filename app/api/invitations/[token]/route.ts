import { NextRequest, NextResponse } from "next/server";
import { db, doctorInvitations } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET - Validate invitation token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { valid: false, reason: "Token is required" },
        { status: 400 },
      );
    }

    // Find invitation by token
    const invitation = await db.query.doctorInvitations.findFirst({
      where: eq(doctorInvitations.token, token),
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, reason: "invalid" },
        { status: 404 },
      );
    }

    // Check status
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { valid: false, reason: "used" },
        { status: 400 },
      );
    }

    if (invitation.status === "REVOKED") {
      return NextResponse.json(
        { valid: false, reason: "revoked" },
        { status: 400 },
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      // Update status to expired
      await db
        .update(doctorInvitations)
        .set({ status: "EXPIRED" })
        .where(eq(doctorInvitations.id, invitation.id));

      return NextResponse.json(
        { valid: false, reason: "expired" },
        { status: 400 },
      );
    }

    // Valid invitation
    return NextResponse.json({
      valid: true,
      email: invitation.email,
      name: invitation.name,
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { valid: false, reason: "error" },
      { status: 500 },
    );
  }
}
