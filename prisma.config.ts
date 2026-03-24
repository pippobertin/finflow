import path from "node:path";
import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env.local first, fallback to .env
config({ path: path.join(__dirname, ".env.local") });
config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  migrations: {
    url: process.env.DIRECT_URL!,
    seed: "npx tsx prisma/seed.ts",
  },

  datasource: {
    url: process.env.DIRECT_URL!,
  },

  studio: {
    url: process.env.DATABASE_URL!,
  },
});
