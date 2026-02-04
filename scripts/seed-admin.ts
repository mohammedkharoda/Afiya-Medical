import "dotenv/config";
import { db, users } from "../lib/db";
import { eq } from "drizzle-orm";

// Admin data - fixed email, no password (uses OTP login)
const ADMIN_DATA = {
  email: "kharodawalam@gmail.com",
  name: "Admin",
  phone: null,
};

async function seedAdmin() {
  const { email, name, phone } = ADMIN_DATA;

  console.log("Checking for existing admin account...");

  // Check if admin already exists
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingAdmin) {
    console.log("Admin account already exists:");
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${existingAdmin.role}`);

    // Update to ADMIN role if not already
    if (existingAdmin.role !== "ADMIN") {
      await db
        .update(users)
        .set({ role: "ADMIN" })
        .where(eq(users.id, existingAdmin.id));
      console.log("   Updated role to ADMIN");
    }

    process.exit(0);
  }

  console.log("Creating new admin account...");

  // Create admin user (no password - uses OTP login)
  const [_admin] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase().trim(),
      password: null, // No password - admin uses OTP login
      phone,
      role: "ADMIN",
      isVerified: true,
      emailVerified: true,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  console.log("Admin account created successfully!");
  console.log("");
  console.log("   Email:", email);
  console.log("   Name:", name);
  console.log("   Login: OTP-based (no password)");
  console.log("");
  console.log("You can now login as admin at /admin/login");

  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("Error seeding admin:", error);
  process.exit(1);
});
