/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: false,
  experimental: {
    optimizeCss: true,
    turbo: { 
      rules: { "*.js": ["jsx"] }
    },
    scrollRestoration: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig 