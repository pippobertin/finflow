/**
 * Reset password for a user in the dev database.
 *
 * Usage:
 *   npx tsx scripts/reset-password.ts <email> <new-password>
 */

import { config } from "dotenv";
import path from "path";
import { hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: path.join(__dirname, "..", ".env.local") });

const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.error(`User "${email}" not found.`);
    process.exit(1);
  }

  const passwordHash = hashSync(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`✓ Password reset for "${user.name}" (${user.email})`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
