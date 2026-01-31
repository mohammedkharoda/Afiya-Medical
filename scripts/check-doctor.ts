import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const doctors = await db
      .select()
      .from(users)
      .where(eq(users.role, "DOCTOR"));
    console.log("Doctors found:", doctors);

    if (doctors.length === 0) {
      console.log("No doctors found! Creating dummy doctor for testing...");
      // Option to create one if needed, but for now just reporting.
    }
  } catch (error) {
    console.error("Error checking doctors:", error);
  }
}

main();
