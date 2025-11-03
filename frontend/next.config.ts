import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static export for now to allow dynamic routes
  // output: 'export',
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  
  // Asset prefix for production
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;
