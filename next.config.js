/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    INTASEND_API_KEY: process.env.INTASEND_API_KEY,
    INTASEND_PUBLISHABLE_KEY: process.env.INTASEND_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig 