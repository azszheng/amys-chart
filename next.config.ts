import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/chart": ["./public/ephemeris/**/*"],
  },
};

export default nextConfig;
