import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App 100% estático: `npm run build` gera ./out, dá pra jogar em qualquer
  // hosting de arquivo (Vercel, Netlify, GitHub Pages, S3).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
