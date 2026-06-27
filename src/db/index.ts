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

// Connection target for the active Aurora PostgreSQL cluster.
// These are non-secret identifiers (role ARN, region, host, user, db, port);
// the only sensitive credential is the IAM auth token, which is generated at
// runtime via OIDC. DB_*-prefixed env vars take precedence so the values can
// be overridden without colliding with the integration-managed PG*/AWS_* vars.
const DB_CONFIG = {
  roleArn:
    process.env.DB_AWS_ROLE_ARN ||
    "arn:aws:iam::802705728661:role/vercel-trialbridge-db",
  region: process.env.DB_AWS_REGION || "us-east-1",
  host:
    process.env.DB_PGHOST ||
    "trialbridge-cluster.cluster-cs7ymoqccnfp.us-east-1.rds.amazonaws.com",
  user: process.env.DB_PGUSER || "app_user",
  database: process.env.DB_PGDATABASE || "trialbridge",
  port: process.env.DB_PGPORT ? Number(process.env.DB_PGPORT) : 5432,
};

function createPool(): Pool {
  const { roleArn, region, host, user, database, port } = DB_CONFIG;

  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn,
      clientConfig: { region },
    }),
    region,
    hostname: host,
    username: user,
    port,
  });

  return new Pool({
    host,
    database,
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
