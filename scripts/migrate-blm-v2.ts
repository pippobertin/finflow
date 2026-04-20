/**
 * BLM V2 Data Migration Script (idempotent)
 *
 * Creates "Studio BLM" AccountingFirm and links existing BLM data:
 *   1. Upsert AccountingFirm "Studio BLM" in finflow schema
 *   2. Link "BLM Project Srl" Organization → accountingFirmId
 *   3. Set admin@blmproject.com User → userType=CONTROLLER, accountingFirmId
 *   4. Set viewer@blmproject.com User → userType=CLIENT_OWNER (no firm link)
 *
 * Usage:
 *   npx tsx scripts/migrate-blm-v2.ts           # dry-run (default)
 *   npx tsx scripts/migrate-blm-v2.ts --apply   # apply changes
 */

import { config } from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: path.join(__dirname, "..", ".env.local") });

const dryRun = !process.argv.includes("--apply");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const FIRM_NAME = "Studio BLM";
const ORG_VAT = "IT02652950425";
const CONTROLLER_EMAIL = "admin@blmproject.com";
const CLIENT_EMAIL = "viewer@blmproject.com";

async function main() {
  console.log(`\n=== BLM V2 Migration ${dryRun ? "(DRY RUN)" : "(APPLY)"} ===\n`);

  // ── Step 1: Find BLM Organization ─────────────────────────
  const org = await prisma.organization.findFirst({
    where: { vatNumber: ORG_VAT },
    select: { id: true, name: true, accountingFirmId: true },
  });

  if (!org) {
    console.error(`❌ Organization with VAT ${ORG_VAT} not found. Aborting.`);
    process.exit(1);
  }
  console.log(`✓ Found Organization: "${org.name}" (${org.id})`);

  // ── Step 2: Upsert AccountingFirm ────────────────────────
  let firm = await prisma.accountingFirm.findFirst({
    where: { name: FIRM_NAME },
    select: { id: true, name: true },
  });

  if (firm) {
    console.log(`✓ AccountingFirm "${firm.name}" already exists (${firm.id}) — skipping create`);
  } else {
    console.log(`→ Will create AccountingFirm "${FIRM_NAME}"`);
    if (!dryRun) {
      firm = await prisma.accountingFirm.create({
        data: { name: FIRM_NAME },
        select: { id: true, name: true },
      });
      console.log(`✓ Created AccountingFirm "${firm.name}" (${firm.id})`);
    }
  }

  const firmId = firm?.id;

  // ── Step 3: Link Organization → AccountingFirm ────────────
  if (org.accountingFirmId === firmId) {
    console.log(`✓ Organization already linked to "${FIRM_NAME}" — skipping`);
  } else if (org.accountingFirmId) {
    console.log(
      `⚠ Organization already linked to DIFFERENT firm (${org.accountingFirmId}). Skipping to avoid overwrite.`,
    );
  } else {
    console.log(`→ Will link Organization "${org.name}" → AccountingFirm "${FIRM_NAME}"`);
    if (!dryRun && firmId) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { accountingFirmId: firmId },
      });
      console.log(`✓ Organization linked`);
    }
  }

  // ── Step 4: Set admin user as CONTROLLER ──────────────────
  const adminUser = await prisma.user.findUnique({
    where: { email: CONTROLLER_EMAIL },
    select: { id: true, name: true, userType: true, accountingFirmId: true },
  });

  if (!adminUser) {
    console.log(`⚠ User ${CONTROLLER_EMAIL} not found — skipping`);
  } else if (adminUser.userType === "CONTROLLER" && adminUser.accountingFirmId === firmId) {
    console.log(`✓ User "${adminUser.name}" already CONTROLLER with firm link — skipping`);
  } else {
    console.log(
      `→ Will set User "${adminUser.name}" (${CONTROLLER_EMAIL}) → CONTROLLER + accountingFirmId`,
    );
    if (!dryRun && firmId) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { userType: "CONTROLLER", accountingFirmId: firmId },
      });
      console.log(`✓ User updated to CONTROLLER`);
    }
  }

  // ── Step 5: Set viewer user as CLIENT_OWNER ───────────────
  const viewerUser = await prisma.user.findUnique({
    where: { email: CLIENT_EMAIL },
    select: { id: true, name: true, userType: true },
  });

  if (!viewerUser) {
    console.log(`⚠ User ${CLIENT_EMAIL} not found — skipping`);
  } else if (viewerUser.userType === "CLIENT_OWNER") {
    console.log(`✓ User "${viewerUser.name}" already CLIENT_OWNER — skipping`);
  } else {
    console.log(`→ Will set User "${viewerUser.name}" (${CLIENT_EMAIL}) → CLIENT_OWNER`);
    if (!dryRun) {
      await prisma.user.update({
        where: { id: viewerUser.id },
        data: { userType: "CLIENT_OWNER" },
      });
      console.log(`✓ User updated to CLIENT_OWNER`);
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log(
    `\n=== Done ${dryRun ? "(DRY RUN — no changes applied, run with --apply to execute)" : "(APPLIED)"} ===\n`,
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
