import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // TypeScript e ESLint vengono validati localmente (tsc --noEmit + lint-staged
  // pre-commit). Su Vercel li skippiamo perché il typecheck strict può saturare
  // la memoria del piano Hobby (8GB) e il build si interrompe silenziosamente.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
