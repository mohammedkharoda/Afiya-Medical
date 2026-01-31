import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function checkSchema() {
  console.log("Checking doctor_schedule table columns...\n");

  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'doctor_schedule'
    ORDER BY ordinal_position
  `;

  console.log("Current columns in doctor_schedule:");
  columns.forEach((col: any) => {
    console.log(`  - ${col.column_name}: ${col.data_type}`);
  });

  // Check if scheduleDate exists
  const hasScheduleDate = columns.some(
    (col: any) => col.column_name === "scheduleDate",
  );
  const hasDayOfWeek = columns.some(
    (col: any) => col.column_name === "dayOfWeek",
  );

  console.log("\n--- Status ---");
  console.log(`scheduleDate column exists: ${hasScheduleDate}`);
  console.log(`dayOfWeek column exists: ${hasDayOfWeek}`);

  if (hasDayOfWeek && !hasScheduleDate) {
    console.log(
      "\nNeed to migrate: Adding scheduleDate and removing dayOfWeek...",
    );

    // Add scheduleDate column if it doesn't exist
    await sql`ALTER TABLE doctor_schedule ADD COLUMN IF NOT EXISTS "scheduleDate" timestamp`;

    // Drop dayOfWeek column
    await sql`ALTER TABLE doctor_schedule DROP COLUMN IF EXISTS "dayOfWeek"`;

    console.log("Migration complete!");
  } else if (hasScheduleDate && !hasDayOfWeek) {
    console.log("\nSchema is correct!");
  } else if (hasScheduleDate && hasDayOfWeek) {
    console.log("\nBoth columns exist. Removing dayOfWeek...");
    await sql`ALTER TABLE doctor_schedule DROP COLUMN IF EXISTS "dayOfWeek"`;
    console.log("Done!");
  }

  // Fetch current data
  const data = await sql`SELECT * FROM doctor_schedule`;
  console.log("\nCurrent schedules:", data.length);
  data.forEach((row: any) => {
    console.log(
      `  - ID: ${row.id}, Date: ${row.scheduleDate}, Active: ${row.isActive}`,
    );
  });
}

checkSchema().catch(console.error);
