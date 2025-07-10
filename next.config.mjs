/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  webpack: (config, { isServer }) => {
    // Desabilita cache do webpack para evitar arquivos grandes no Cloudflare Pages
    config.cache = false;
    return config;
  },
  // Adicionar headers para resolver problemas de CORS com popups OAuth
  async headers() {
    return [
      {
        source: '/api/auth/google-analytics/callback',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ]
      },
      {
        source: '/api/auth/facebook/callback',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          }
        ]
      }
    ]
  }
}

export default nextConfig