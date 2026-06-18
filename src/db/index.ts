import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import * as schema from "./schema";

// Temporary fallback: a manually supplied, pre-signed RDS IAM auth token.
// Used only when OIDC-based role assumption is unavailable (e.g. trust-policy
// not yet propagated). Safe to remove once OIDC auth works end-to-end.
const TOKEN_FILE = join(process.cwd(), ".rds-token");

function readManualToken(): string | null {
  try {
    if (!existsSync(TOKEN_FILE)) return null;
    const value = readFileSync(TOKEN_FILE, "utf8").trim();
    if (value.length === 0) return null;

    // RDS auth tokens carry X-Amz-Date and X-Amz-Expires (seconds). Once
    // expired, return null so we fall back to OIDC-based signing instead of
    // handing Postgres a dead credential.
    const params = new URLSearchParams(value.split("?")[1] ?? "");
    const date = params.get("X-Amz-Date");
    const expires = Number(params.get("X-Amz-Expires") ?? "0");
    if (date && expires) {
      const m = date.match(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
      );
      if (m) {
        const [, y, mo, d, h, mi, s] = m;
        const issued = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
        if (Date.now() > issued + expires * 1000) return null;
      }
    }
    return value;
  } catch {
    // ignore and fall back to the signer
  }
  return null;
}

type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  db: Db | undefined;
};

function createPool(): Pool {
  const host = process.env.PGHOST;
  if (!host) {
    throw new Error(
      "PGHOST environment variable is not set. Connect the Amazon Aurora PostgreSQL integration.",
    );
  }

  const region = process.env.AWS_REGION;
  const user = process.env.PGUSER || "postgres";
  const port = process.env.PGPORT ? Number(process.env.PGPORT) : 5432;

  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region },
    }),
    region,
    hostname: host,
    username: user,
    port,
  });

  return new Pool({
    host,
    database: process.env.PGDATABASE || "postgres",
    port,
    user,
    password: () => readManualToken() ?? signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;

  const pool = globalForDb.pool ?? createPool();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
  }

  const database = drizzle(pool, { schema });
  globalForDb.db = database;
  return database;
}

export function getPool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;
  const pool = createPool();
  globalForDb.pool = pool;
  return pool;
}

export async function resetDb(): Promise<void> {
  if (globalForDb.pool) {
    try {
      await globalForDb.pool.end();
    } catch {
      // ignore
    }
  }
  globalForDb.pool = undefined;
  globalForDb.db = undefined;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const database = getDb();
    const value = database[prop as keyof Db];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});
