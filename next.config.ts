import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // TypeScript validato localmente (tsc --noEmit + lint-staged pre-commit).
  // Su Vercel lo skippiamo perché il typecheck strict può saturare la memoria
  // del piano Hobby (8GB) e il build si interrompe silenziosamente.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
