// Script to seed default doctor schedule for next 30 days
// Run with: npx tsx scripts/seed-schedule.ts

import "dotenv/config";
import { db, doctorSchedule } from "../lib/db";

// Helper to get schedule config based on day of week
function getScheduleForDay(dayOfWeek: number) {
  switch (dayOfWeek) {
    case 0: // Sunday - closed
      return {
        startTime: "09:00",
        endTime: "13:00",
        slotDuration: 30,
        maxPatientsPerSlot: 1,
        isActive: false,
      };
    case 6: // Saturday - half day
      return {
        startTime: "09:00",
        endTime: "13:00",
        slotDuration: 30,
        maxPatientsPerSlot: 1,
        isActive: true,
      };
    default: // Monday to Friday
      return {
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        maxPatientsPerSlot: 1,
        isActive: true,
      };
  }
}

async function seedSchedule() {
  console.log("Seeding doctor schedule for next 30 days...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let successCount = 0;

  for (let i = 0; i < 30; i++) {
    const scheduleDate = new Date(today);
    scheduleDate.setDate(today.getDate() + i);

    const dayOfWeek = scheduleDate.getDay();
    const scheduleConfig = getScheduleForDay(dayOfWeek);

    try {
      await db.insert(doctorSchedule).values({
        scheduleDate,
        ...scheduleConfig,
      }).onConflictDoNothing();

      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
      console.log(
        `✓ ${scheduleDate.toISOString().split('T')[0]} (${dayName}) - ${scheduleConfig.isActive ? "Active" : "Closed"}`,
      );
      successCount++;
    } catch (error) {
      console.error(`Error seeding ${scheduleDate.toISOString().split('T')[0]}:`, error);
    }
  }

  console.log(`\n${successCount} days scheduled successfully!`);
  console.log("Doctor schedule:");
  console.log("- Monday to Friday: 9:00 AM - 5:00 PM");
  console.log("- Saturday: 9:00 AM - 1:00 PM");
  console.log("- Sunday: Closed");
  console.log("- Slot duration: 30 minutes");

  process.exit(0);
}

seedSchedule();
