import { NextRequest, NextResponse } from "next/server";
import { db, verifications, users, sessions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createId } from "@paralleldrive/cuid2";
import { getSessionExpiryByRole, type UserRole } from "@/lib/session-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, token } = body;

    if ((!phone && !token) || !code) {
      return NextResponse.json(
        { success: false, message: "Phone/token and code are required" },
        { status: 400 },
      );
    }

    let phoneE164 = phone;

    // If token provided, resolve token -> phone from verifications table
    if (token) {
      const tokenRec = await db.query.verifications.findFirst({
        where: eq(verifications.identifier, token),
      });
      if (!tokenRec)
        return NextResponse.json(
          { success: false, message: "Invalid or expired token" },
          { status: 400 },
        );
      phoneE164 = tokenRec.value;
    }

    const parsed = parsePhoneNumberFromString(phoneE164 as string);
    if (!parsed || !parsed.isValid())
      return NextResponse.json(
        { success: false, message: "Invalid phone" },
        { status: 400 },
      );
    phoneE164 = parsed.format("E.164");

    const now = new Date();

    // Find all verification records for this phone and filter for OTP records
    // OTP records have identifier=phone and value=6-digit code (not starting with +)
    const verRecords = await db.query.verifications.findMany({
      where: eq(verifications.identifier, phoneE164),
    });

    // Filter to find the actual OTP record (value is 6 digits, not a phone number)
    const ver = verRecords.find((r) => /^\d{6}$/.test(r.value));

    if (!ver)
      return NextResponse.json(
        { success: false, message: "Verification code not found" },
        { status: 400 },
      );
    if (ver.expiresAt < now)
      return NextResponse.json(
        { success: false, message: "Verification code expired" },
        { status: 400 },
      );
    if (ver.value !== String(code))
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 },
      );

    // Remove verification record
    await db.delete(verifications).where(eq(verifications.id, ver.id));

    // Find the unverified user with this phone number (the one who just registered)
    const userToVerify = await db.query.users.findFirst({
      where: and(eq(users.phone, phoneE164), eq(users.isVerified, false)),
      columns: { id: true, role: true },
    });

    if (!userToVerify)
      return NextResponse.json(
        { success: false, message: "User not found or already verified" },
        { status: 404 },
      );

    // Mark user as verified
    await db
      .update(users)
      .set({ isVerified: true, emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userToVerify.id));

    // Create session with role-based expiry
    const sessionToken = createId();
    const userRole = (userToVerify.role || "PATIENT") as UserRole;
    const expiresAtSession = getSessionExpiryByRole(userRole);
    await db.insert(sessions).values({
      id: createId(),
      token: sessionToken,
      userId: userToVerify.id,
      expiresAt: expiresAtSession,
      ipAddress: null,
      userAgent: null,
    });

    const response = NextResponse.json({
      success: true,
      message: "Phone verified",
    });
    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAtSession,
    });
    return response;
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
