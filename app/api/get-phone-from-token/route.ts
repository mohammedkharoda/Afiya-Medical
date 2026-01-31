import { db, verifications, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find the verification entry by token (identifier)
    // The token maps to phone in the value field
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.identifier, token),
    });

    if (!verification) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // The value field contains the phone number (E.164 format)
    const phone = verification.value;

    if (phone && phone.startsWith("+")) {
      // Fetch the unverified user's email using the phone number
      // This ensures we get the user who just registered, not an existing verified user
      const user = await db.query.users.findFirst({
        where: and(eq(users.phone, phone), eq(users.isVerified, false)),
        columns: { email: true },
      });

      // If no unverified user found, try to find any user with this phone
      // (fallback for edge cases)
      if (!user) {
        const anyUser = await db.query.users.findFirst({
          where: eq(users.phone, phone),
          columns: { email: true },
        });
        return NextResponse.json({
          phone,
          email: anyUser?.email || null,
        });
      }

      return NextResponse.json({
        phone,
        email: user.email,
      });
    }

    return NextResponse.json({ error: "Phone not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching phone from token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
