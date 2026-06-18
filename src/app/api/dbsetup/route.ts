import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPool } from "@/db";
import { seedDatabase } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const schemaSql = readFileSync(
      join(process.cwd(), "scripts", "001-setup-schema.sql"),
      "utf8",
    );
    // Use the simple query protocol so multiple statements / dollar-quoted
    // DO blocks execute in a single call.
    await getPool().query(schemaSql);
    const result = await seedDatabase();
    return Response.json({ ok: true, result });
  } catch (err) {
    console.error("[v0] setup failed:", err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
