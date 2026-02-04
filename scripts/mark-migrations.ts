import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import path from "path";

type JournalEntry = {
  tag: string;
  when: number;
};

type Journal = {
  entries: JournalEntry[];
};

const sql = neon(process.env.DATABASE_URL!);

async function markMigrations() {
  const journalPath = path.join(
    process.cwd(),
    "drizzle",
    "meta",
    "_journal.json",
  );
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as Journal;

  const latest = journal.entries[journal.entries.length - 1];
  if (!latest) {
    throw new Error("No migrations found in drizzle/meta/_journal.json");
  }

  await sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await sql`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `;

  const existing = await sql`
    SELECT created_at
    FROM "drizzle"."__drizzle_migrations"
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const existingCreatedAt = existing[0]?.created_at
    ? Number(existing[0].created_at)
    : 0;

  if (existingCreatedAt < latest.when) {
    await sql`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${latest.tag}, ${latest.when})
    `;
    console.log(
      `Baselined migrations at ${latest.tag} (created_at=${latest.when}).`,
    );
  } else {
    console.log("Migrations already baselined.");
  }
}

markMigrations().catch((error) => {
  console.error("Failed to baseline migrations:", error);
  process.exit(1);
});
