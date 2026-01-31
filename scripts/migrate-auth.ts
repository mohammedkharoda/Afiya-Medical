import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running migrations...");

  try {
    // Add new columns to users table
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT false NOT NULL`;
    console.log("Added emailVerified column");
  } catch (e: any) {
    console.log("emailVerified column may already exist:", e.message);
  }

  try {
    await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text`;
    console.log("Added image column");
  } catch (e: any) {
    console.log("image column may already exist:", e.message);
  }

  try {
    await sql`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`;
    console.log("Made password nullable");
  } catch (e: any) {
    console.log("password already nullable:", e.message);
  }

  try {
    await sql`ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL`;
    console.log("Made phone nullable");
  } catch (e: any) {
    console.log("phone already nullable:", e.message);
  }

  // Create sessions table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "ipAddress" text,
        "userAgent" text,
        "createdAt" timestamp NOT NULL,
        "updatedAt" timestamp NOT NULL
      )
    `;
    console.log("Created sessions table");
  } catch (e: any) {
    console.log("sessions table error:", e.message);
  }

  // Create accounts table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "accessToken" text,
        "refreshToken" text,
        "accessTokenExpiresAt" timestamp,
        "refreshTokenExpiresAt" timestamp,
        "scope" text,
        "idToken" text,
        "password" text,
        "createdAt" timestamp NOT NULL,
        "updatedAt" timestamp NOT NULL
      )
    `;
    console.log("Created accounts table");
  } catch (e: any) {
    console.log("accounts table error:", e.message);
  }

  // Create verifications table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "verifications" (
        "id" text PRIMARY KEY NOT NULL,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp NOT NULL,
        "updatedAt" timestamp NOT NULL
      )
    `;
    console.log("Created verifications table");
  } catch (e: any) {
    console.log("verifications table error:", e.message);
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
