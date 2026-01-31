import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is required" },
        { status: 400 },
      );
    }

    // Find user with this verification token
    const user = await db.query.users.findFirst({
      where: eq(users.verificationToken, token),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: "Email already verified",
      });
    }

    // Update user to verified
    await db
      .update(users)
      .set({
        isVerified: true,
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 },
    );
  }
}
