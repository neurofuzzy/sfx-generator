import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Static export configuration for GitHub Pages */
  output: 'export',
  /* 
     Dynamically set basePath: 
     - On GitHub Actions (deployment), use '/sfx-generator'
     - Locally or in Studio, use '' (root)
  */
  basePath: process.env.GITHUB_ACTIONS === 'true' ? '/sfx-generator' : '',
  /* trailingSlash: true ensures that folders are generated with index.html, which is better for GH Pages */
  trailingSlash: true,
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
