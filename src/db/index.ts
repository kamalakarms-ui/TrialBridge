import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import * as schema from "./schema";

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
    password: () => signer.getAuthToken(),
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
