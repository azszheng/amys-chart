import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sweph is a native Node addon (.node binary) — must not be bundled
  serverExternalPackages: ['sweph'],
  outputFileTracingIncludes: {
    "/api/chart": ["./public/ephemeris/**/*"],
  },
};

export default nextConfig;
