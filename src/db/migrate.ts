#!/usr/bin/env tsx
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and configure.");
    process.exit(1);
  }

  console.log("🔄 Running database migrations...");
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.end();

  console.log("✅ Migrations complete.");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
