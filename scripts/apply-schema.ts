import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.join(__dirname, "..", ".env.local") });

import pg from "pg";

async function main() {
  const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  console.log("Connected to DB");

  const sql = fs.readFileSync(path.join(__dirname, "..", "prisma", "manual-init.sql"), "utf-8");

  // Execute the SQL
  await client.query(sql);
  console.log("Schema applied successfully!");

  // Verify tables were created
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'fin_%'
    ORDER BY table_name
  `);
  console.log("\nCreated fin_* tables:");
  for (const row of res.rows) {
    console.log("  -", row.table_name);
  }

  await client.end();
}

main().catch(console.error);
