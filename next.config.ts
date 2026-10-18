import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    useTypeScriptCli: false,
  },
  /* config options here */
  reactStrictMode: false,
};

export default nextConfig;
