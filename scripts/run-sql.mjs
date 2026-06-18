import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-sql.mjs <path-to-sql>");
  process.exit(1);
}

const region = process.env.AWS_REGION;
const host = process.env.PGHOST;
const user = process.env.PGUSER || "postgres";
const port = process.env.PGPORT ? Number(process.env.PGPORT) : 5432;

const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region },
  }),
  region,
  hostname: host,
  username: user,
  port,
});

const pool = new Pool({
  host,
  database: process.env.PGDATABASE || "postgres",
  port,
  user,
  password: () => signer.getAuthToken(),
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const sql = readFileSync(file, "utf8");

try {
  await pool.query(sql);
  console.log(`✅ Executed ${file}`);
} catch (err) {
  console.error(`❌ Failed executing ${file}:`, err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
