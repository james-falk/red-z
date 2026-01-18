/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'via.placeholder.com'],
  },
  transpilePackages: ['@fantasy-red-zone/shared'],
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2'],
  },
}

module.exports = nextConfig
