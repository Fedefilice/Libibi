/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'covers.openlibrary.org', 
      'covers.openlibrary.org',
      'ia800603.us.archive.org',
      'ia801603.us.archive.org'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.archive.org',
      },
      {
        protocol: 'https',
        hostname: '*.openlibrary.org',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude Node.js specific modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Externalize database-related packages for server-side only
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push('mssql', 'tedious', '@prisma/client');
    }
    
    return config;
  },
}

export default nextConfig;