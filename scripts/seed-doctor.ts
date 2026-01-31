import "dotenv/config";
import { db, users } from "../lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Doctor data - hardcoded for single doctor system
const DOCTOR_DATA = {
  email: "doctor@afiya.com",
  password: "Doctor@123",
  name: "Dr. Farheen Husain",
  phone: "+917778878653",
};

async function seedDoctor() {
  const { email, password, name, phone } = DOCTOR_DATA;

  console.log("🔄 Checking for existing doctor account...");

  // Check if doctor already exists
  const existingDoctor = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingDoctor) {
    console.log("✅ Doctor account already exists:");
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${existingDoctor.role}`);

    // Update to DOCTOR role if not already
    if (existingDoctor.role !== "DOCTOR") {
      await db
        .update(users)
        .set({ role: "DOCTOR" })
        .where(eq(users.id, existingDoctor.id));
      console.log("   Updated role to DOCTOR");
    }

    process.exit(0);
  }

  console.log("🔄 Creating new doctor account...");

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create doctor user
  const [_doctor] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      role: "DOCTOR",
      isVerified: true, // Doctor is pre-verified
      emailVerified: true,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

  console.log("✅ Doctor account created successfully!");
  console.log("");
  console.log("   📧 Email:", email);
  console.log("   🔐 Password:", password);
  console.log("   👤 Name:", name);
  console.log("   📱 Phone:", phone);
  console.log("");
  console.log("You can now login as the doctor at /login");

  process.exit(0);
}

seedDoctor().catch((error) => {
  console.error("❌ Error seeding doctor:", error);
  process.exit(1);
});
