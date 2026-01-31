import { NextRequest, NextResponse } from "next/server";
import { db, verifications, users } from "@/lib/db";
import { eq, gt } from "drizzle-orm";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { phone, token } = await req.json();
    if (!phone && !token)
      return NextResponse.json(
        { success: false, message: "Phone or token is required" },
        { status: 400 },
      );

    let phoneE164 = phone;
    if (token && !phoneE164) {
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

    // Rate-limit: don't resend if an OTP was created within the last 60 seconds
    const recentRows = await db.query.verifications.findMany({
      where: eq(verifications.identifier, phoneE164),
    });
    const recent = recentRows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (recent) {
      const age = Date.now() - new Date(recent.createdAt).getTime();
      if (age < 60 * 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "Please wait before requesting another code",
          },
          { status: 429 },
        );
      }
    }

    // Generate new OTP, store and (sending handled by register logic or here)
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db
      .insert(verifications)
      .values({ identifier: phoneE164, value: otp, expiresAt });

    // Get user email from database and send OTP via email
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.phone, phoneE164),
        columns: { email: true },
      });

      if (user?.email) {
        await sendOtpEmail(user.email, otp);
      } else {
        console.log(`Resent OTP for ${phoneE164}: ${otp} (no email found)`);
      }
    } catch (e) {
      console.error("Failed to send OTP email on resend:", e);
    }

    return NextResponse.json({
      success: true,
      message: "OTP resent to your email",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
