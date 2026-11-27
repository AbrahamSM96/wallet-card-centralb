import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/*': ['./public/brand/**/*'],
  },
  reactStrictMode: true,
}

export default nextConfig
