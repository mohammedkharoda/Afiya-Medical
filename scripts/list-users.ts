import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function main() {
  try {
    console.log("Fetching all users...");
    const allUsers = await db.select().from(users);

    console.log("\n=== ALL USERS ===");
    allUsers.forEach((user) => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Role type: ${typeof user.role}`);
      console.log("---");
    });

    console.log(`\nTotal users: ${allUsers.length}`);
    console.log(
      `Doctors: ${allUsers.filter((u) => u.role === "DOCTOR").length}`,
    );
    console.log(
      `Patients: ${allUsers.filter((u) => u.role === "PATIENT").length}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
