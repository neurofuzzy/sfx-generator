import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Static export configuration for GitHub Pages */
  output: 'export',
  /* Set basePath for deployment to neurofuzzy.github.io/sfx-generator/ */
  /* basePath: '/sfx-generator', */
  /* Images must be unoptimized for static hosting */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
