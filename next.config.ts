import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  devIndicators: {
    position: "top-left",
  },
};

export default nextConfig;
