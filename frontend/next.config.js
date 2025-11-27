/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
    // Adicionar domínio do Koyeb quando disponível
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.koyeb.app',
      },
    ],
  },
  async rewrites() {
    // Em produção na Vercel, usar variável de ambiente NEXT_PUBLIC_API_URL
    // Em desenvolvimento local ou Docker, usar BACKEND_URL ou localhost
    const isProduction = process.env.NODE_ENV === 'production';
    const backendUrl = isProduction 
      ? process.env.NEXT_PUBLIC_API_URL || ''
      : (process.env.BACKEND_URL || 'http://localhost:8000');
    
    console.log(`[Next.js Config] Backend URL: ${backendUrl}`);
    console.log(`[Next.js Config] NODE_ENV: ${process.env.NODE_ENV}`);
    
    // Se não houver backendUrl em produção, não fazer rewrite (Vercel vai usar vercel.json)
    if (isProduction && !backendUrl) {
      return [];
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
