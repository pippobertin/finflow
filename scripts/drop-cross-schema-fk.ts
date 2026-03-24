import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "..", ".env.local") });

import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DIRECT_URL });

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // Find FK constraints from PUBLIC tables pointing to auth schema
  const res = await client.query(`
    SELECT
      con.conname,
      nsp.nspname as schema_name,
      cls.relname as table_name
    FROM pg_constraint con
    JOIN pg_class cls ON con.conrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND con.confrelid::regclass::text LIKE 'auth.%'
  `);

  console.log(`Found ${res.rows.length} FK constraints in public tables pointing to auth schema`);

  for (const row of res.rows) {
    console.log(`  Dropping: public.${row.table_name} -> ${row.conname}`);
    await client.query(
      `ALTER TABLE public.${row.table_name} DROP CONSTRAINT IF EXISTS ${row.conname}`,
    );
  }

  console.log("Done!");
  await client.end();
}

main().catch(console.error);
