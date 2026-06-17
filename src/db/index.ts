import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: Db | undefined;
};

function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. See .env.example for setup.",
    );
  }

  const client =
    globalForDb.client ??
    postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }

  const database = drizzle(client, { schema });
  globalForDb.db = database;
  return database;
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
