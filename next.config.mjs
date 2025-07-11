/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components
  serverExternalPackages: ['@google-cloud/storage'],
  
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
