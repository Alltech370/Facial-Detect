const path = require('path');

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
  webpack: (config, { dir, isServer }) => {
    // Resolver path aliases explicitamente
    const srcPath = path.resolve(dir, 'src');
    
    // Configurar alias
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias['@'] = srcPath;
    
    // Garantir que os módulos sejam resolvidos corretamente
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    config.resolve.modules = [
      srcPath,
      path.resolve(dir, 'node_modules'),
      ...config.resolve.modules,
    ];
    
    // Adicionar extensões
    if (!config.resolve.extensions) {
      config.resolve.extensions = [];
    }
    config.resolve.extensions = [
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
      ...config.resolve.extensions.filter(ext => !['.tsx', '.ts', '.jsx', '.js', '.json'].includes(ext)),
    ];
    
    console.log('[Webpack Config] Alias @ resolved to:', srcPath);
    console.log('[Webpack Config] Dir:', dir);
    
    return config;
  },
  async rewrites() {
    // Em produção na Vercel, deixar o vercel.json fazer os rewrites
    // Em desenvolvimento local ou Docker, usar BACKEND_URL ou localhost
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Em produção, não fazer rewrites aqui (Vercel usa vercel.json)
    if (isProduction) {
      return [];
    }
    
    // Em desenvolvimento, fazer rewrite para localhost ou BACKEND_URL
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8000').trim();
    
    console.log(`[Next.js Config] Backend URL: ${backendUrl}`);
    console.log(`[Next.js Config] NODE_ENV: ${process.env.NODE_ENV}`);
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
