/**
 * Dump all fin_* tables from the public schema.
 * Produces a .sql file with CREATE TABLE DDL + INSERT statements.
 * Uses the DIRECT_URL from .env.local.
 *
 * Usage: node scripts/dump-fin-tables.mjs
 */
import { Client } from "pg";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Load .env.local
config({ path: resolve(root, ".env.local") });

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  console.error("DIRECT_URL not found in .env.local");
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  await client.connect();
  console.log("Connected to database.");

  // Get all fin_* tables in public schema
  const { rows: tables } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE 'fin_%'
    ORDER BY table_name
  `);

  console.log(`Found ${tables.length} fin_* tables.`);

  const lines = [];
  lines.push("-- FinFlow pre-V2 backup");
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Tables: ${tables.length}`);
  lines.push("BEGIN;");
  lines.push("");

  for (const { table_name } of tables) {
    console.log(`  Dumping ${table_name}...`);

    // Get column info
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable,
             character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table_name]);

    // Get CREATE TABLE via pg_dump-style reconstruction
    const colDefs = columns.map(c => {
      let def = `  "${c.column_name}" ${c.data_type}`;
      if (c.character_maximum_length) def += `(${c.character_maximum_length})`;
      if (c.data_type === "numeric" && c.numeric_precision)
        def += `(${c.numeric_precision},${c.numeric_scale || 0})`;
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      if (c.is_nullable === "NO") def += " NOT NULL";
      return def;
    });

    lines.push(`-- Table: ${table_name} (${columns.length} columns)`);
    lines.push(`DROP TABLE IF EXISTS "public"."${table_name}" CASCADE;`);
    lines.push(`CREATE TABLE "public"."${table_name}" (`);
    lines.push(colDefs.join(",\n"));
    lines.push(");");
    lines.push("");

    // Get indexes
    const { rows: indexes } = await client.query(`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
    `, [table_name]);
    for (const idx of indexes) {
      lines.push(idx.indexdef + ";");
    }
    lines.push("");

    // Dump data
    const { rows: data, fields } = await client.query(
      `SELECT * FROM "public"."${table_name}"`
    );

    if (data.length > 0) {
      const colNames = fields.map(f => `"${f.name}"`).join(", ");
      lines.push(`-- Data: ${data.length} rows`);

      for (const row of data) {
        const vals = fields.map(f => {
          const v = row[f.name];
          if (v === null || v === undefined) return "NULL";
          if (v instanceof Date) return `'${v.toISOString()}'`;
          if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
          if (typeof v === "number") return String(v);
          if (Array.isArray(v)) {
            const escaped = v.map(item => `"${String(item).replace(/"/g, '\\"')}"`);
            return `'{${escaped.join(",")}}'`;
          }
          if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        lines.push(`INSERT INTO "public"."${table_name}" (${colNames}) VALUES (${vals.join(", ")});`);
      }
      lines.push("");
    }
  }

  // Also dump enums
  const { rows: enums } = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname LIKE 'fin_%'
    ORDER BY t.typname, e.enumsortorder
  `);

  if (enums.length > 0) {
    lines.push("-- Enums");
    const grouped = {};
    for (const { typname, enumlabel } of enums) {
      if (!grouped[typname]) grouped[typname] = [];
      grouped[typname].push(enumlabel);
    }
    for (const [name, labels] of Object.entries(grouped)) {
      lines.push(`-- CREATE TYPE "public"."${name}" AS ENUM (${labels.map(l => `'${l}'`).join(", ")});`);
    }
    lines.push("");
  }

  lines.push("COMMIT;");

  const date = new Date().toISOString().split("T")[0];
  const outPath = resolve(root, "backups", `pre-v2-${date}.sql`);
  writeFileSync(outPath, lines.join("\n"), "utf-8");

  const sizeKb = Math.round(lines.join("\n").length / 1024);
  console.log(`\nDump saved to: ${outPath} (${sizeKb} KB)`);

  await client.end();
}

main().catch(err => {
  console.error("Dump failed:", err.message);
  client.end();
  process.exit(1);
});
