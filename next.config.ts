import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {
    domains: [
      'residuesimage.s3.amazonaws.com',
    ],
    // Configurações para máxima qualidade
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Desabilita otimização de tamanho para manter qualidade máxima
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
