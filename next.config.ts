import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicit environment variables configuration
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_HELIUS_RPC_ENDPOINT: process.env.NEXT_PUBLIC_HELIUS_RPC_ENDPOINT,
    NEXT_PUBLIC_PUMP_PROGRAM_ID: process.env.NEXT_PUBLIC_PUMP_PROGRAM_ID,
  },
  // Runtime configuration
  publicRuntimeConfig: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_HELIUS_RPC_ENDPOINT: process.env.NEXT_PUBLIC_HELIUS_RPC_ENDPOINT,
    NEXT_PUBLIC_PUMP_PROGRAM_ID: process.env.NEXT_PUBLIC_PUMP_PROGRAM_ID,
  },
};

export default nextConfig;
