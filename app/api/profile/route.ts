import { NextRequest, NextResponse } from "next/server";
import { db, users, patientProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch patient profile if user is a patient
    let patientProfile = null;
    if (user.role === "PATIENT") {
      patientProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, user.id),
        columns: {
          id: true,
          userId: true,
          dob: true,
          gender: true,
          bloodGroup: true,
          address: true,
          emergencyContact: true,
        },
      });
    }

    return NextResponse.json({
      user,
      patientProfile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, dob, gender, bloodGroup, address, emergencyContact } =
      body;

    // Update user data
    const updateUserData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateUserData.name = name;
    if (phone !== undefined) updateUserData.phone = phone;

    await db
      .update(users)
      .set(updateUserData)
      .where(eq(users.id, session.user.id));

    // Fetch the user to check role
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create patient profile if user is a patient
    let patientProfile = null;
    if (user.role === "PATIENT") {
      // Check if patient profile exists
      const existingProfile = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.userId, user.id),
      });

      const profileData = {
        dob: dob ? new Date(dob) : existingProfile?.dob || new Date(),
        gender: gender || existingProfile?.gender || "OTHER",
        bloodGroup: bloodGroup || existingProfile?.bloodGroup || null,
        address: address || existingProfile?.address || "",
        emergencyContact:
          emergencyContact || existingProfile?.emergencyContact || "",
        updatedAt: new Date(),
      };

      if (existingProfile) {
        // Update existing profile
        await db
          .update(patientProfiles)
          .set(profileData)
          .where(eq(patientProfiles.id, existingProfile.id));

        patientProfile = await db.query.patientProfiles.findFirst({
          where: eq(patientProfiles.id, existingProfile.id),
          columns: {
            id: true,
            userId: true,
            dob: true,
            gender: true,
            bloodGroup: true,
            address: true,
            emergencyContact: true,
          },
        });
      } else if (dob && gender && address && emergencyContact) {
        // Create new profile only if all required fields are provided
        const [newProfile] = await db
          .insert(patientProfiles)
          .values({
            userId: user.id,
            dob: new Date(dob),
            gender: gender,
            bloodGroup: bloodGroup || null,
            address: address,
            emergencyContact: emergencyContact,
          })
          .returning();

        patientProfile = {
          id: newProfile.id,
          userId: newProfile.userId,
          dob: newProfile.dob,
          gender: newProfile.gender,
          bloodGroup: newProfile.bloodGroup,
          address: newProfile.address,
          emergencyContact: newProfile.emergencyContact,
        };
      }
    }

    return NextResponse.json({
      user,
      patientProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
