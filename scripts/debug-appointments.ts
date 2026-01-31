// Debug script to check patient profile and appointments linkage
// Run with: npx tsx scripts/debug-appointments.ts

import "dotenv/config";
import { db, users, patientProfiles, appointments } from "../lib/db";

async function debugAppointments() {
  console.log("\n=== DEBUGGING APPOINTMENTS ===\n");

  // Get all users
  const allUsers = await db.query.users.findMany({
    columns: { id: true, email: true, name: true, role: true },
  });
  console.log("Users:");
  allUsers.forEach((u) => {
    console.log(`  - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
  });

  // Get all patient profiles
  const allProfiles = await db.query.patientProfiles.findMany({
    columns: { id: true, userId: true, hasCompletedMedicalHistory: true },
  });
  console.log("\nPatient Profiles:");
  allProfiles.forEach((p) => {
    console.log(
      `  - Profile ID: ${p.id}, User ID: ${p.userId}, HasMedHistory: ${p.hasCompletedMedicalHistory}`,
    );
  });

  // Get all appointments
  const allAppointments = await db.query.appointments.findMany({
    columns: {
      id: true,
      patientId: true,
      appointmentDate: true,
      appointmentTime: true,
      status: true,
    },
  });
  console.log("\nAppointments:");
  allAppointments.forEach((a) => {
    console.log(
      `  - ID: ${a.id}, Patient ID: ${a.patientId}, Date: ${a.appointmentDate}, Time: ${a.appointmentTime}, Status: ${a.status}`,
    );
  });

  // Check linkage
  console.log("\n=== CHECKING LINKAGE ===\n");
  for (const apt of allAppointments) {
    const profile = allProfiles.find((p) => p.id === apt.patientId);
    if (profile) {
      const user = allUsers.find((u) => u.id === profile.userId);
      console.log(
        `✓ Appointment ${apt.id} -> Profile ${profile.id} -> User ${user?.email || "NOT FOUND"}`,
      );
    } else {
      console.log(
        `✗ Appointment ${apt.id} has patientId ${apt.patientId} which does NOT match any profile!`,
      );
    }
  }

  process.exit(0);
}

debugAppointments();
