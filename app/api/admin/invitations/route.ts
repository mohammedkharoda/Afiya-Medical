import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/session";
import { db, users, doctorInvitations } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { doctorInvitationSchema } from "@/lib/validations/auth";
import { sendDoctorInvitationEmail } from "@/lib/email";

const INVITATION_EXPIRY_DAYS = 7;

// GET - List all invitations
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can access invitations" },
        { status: 403 },
      );
    }

    // Fetch all invitations ordered by creation date
    const invitations = await db.query.doctorInvitations.findMany({
      orderBy: [desc(doctorInvitations.createdAt)],
    });

    // Check and mark expired invitations
    const now = new Date();
    const updatedInvitations = invitations.map((inv) => {
      if (inv.status === "PENDING" && inv.expiresAt < now) {
        return { ...inv, status: "EXPIRED" as const };
      }
      return inv;
    });

    return NextResponse.json({ invitations: updatedInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}

// POST - Send a new invitation
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can send invitations" },
        { status: 403 },
      );
    }

    const body = await req.json();

    // Validate input
    const validatedData = doctorInvitationSchema.parse(body);
    const { email, name, isTestAccount } = validatedData;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already has a user account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Check for existing PENDING invitation
    const existingInvitation = await db.query.doctorInvitations.findFirst({
      where: eq(doctorInvitations.email, normalizedEmail),
    });

    if (existingInvitation && existingInvitation.status === "PENDING") {
      // Check if still valid
      if (existingInvitation.expiresAt > new Date()) {
        return NextResponse.json(
          {
            error:
              "An active invitation already exists for this email. Use resend to send a new link.",
            existingInvitationId: existingInvitation.id,
          },
          { status: 400 },
        );
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("base64url");

    // Calculate expiry
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    // Create invitation record
    const [invitation] = await db
      .insert(doctorInvitations)
      .values({
        email: normalizedEmail,
        name: name || null,
        token,
        status: "PENDING",
        invitedBy: session.user.id,
        expiresAt,
        isTestAccount: isTestAccount || false,
      })
      .returning();

    // Build signup URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const signupUrl = `${baseUrl}/register/doctor?token=${token}`;

    // Send invitation email
    const emailSent = await sendDoctorInvitationEmail(
      normalizedEmail,
      name,
      signupUrl,
      INVITATION_EXPIRY_DAYS,
    );

    if (!emailSent) {
      console.error("Failed to send invitation email");
      // Still return success since the invitation was created
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error sending invitation:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 },
    );
  }
}

// PATCH - Resend or revoke invitation
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can manage invitations" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { invitationId, action } = body;

    if (!invitationId || !action) {
      return NextResponse.json(
        { error: "invitationId and action are required" },
        { status: 400 },
      );
    }

    // Find the invitation
    const invitation = await db.query.doctorInvitations.findFirst({
      where: eq(doctorInvitations.id, invitationId),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    if (action === "resend") {
      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: "Can only resend pending invitations" },
          { status: 400 },
        );
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomBytes(32).toString("base64url");
      const newExpiresAt = new Date(
        Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      );

      // Update invitation
      await db
        .update(doctorInvitations)
        .set({
          token: newToken,
          expiresAt: newExpiresAt,
        })
        .where(eq(doctorInvitations.id, invitationId));

      // Build signup URL
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const signupUrl = `${baseUrl}/register/doctor?token=${newToken}`;

      // Send new invitation email
      await sendDoctorInvitationEmail(
        invitation.email,
        invitation.name || undefined,
        signupUrl,
        INVITATION_EXPIRY_DAYS,
      );

      return NextResponse.json({
        success: true,
        message: "Invitation resent successfully",
      });
    } else if (action === "revoke") {
      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: "Can only revoke pending invitations" },
          { status: 400 },
        );
      }

      // Update status to REVOKED
      await db
        .update(doctorInvitations)
        .set({ status: "REVOKED" })
        .where(eq(doctorInvitations.id, invitationId));

      return NextResponse.json({
        success: true,
        message: "Invitation revoked successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'resend' or 'revoke'" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error managing invitation:", error);
    return NextResponse.json(
      { error: "Failed to manage invitation" },
      { status: 500 },
    );
  }
}
