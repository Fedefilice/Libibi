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
}

export default nextConfig;