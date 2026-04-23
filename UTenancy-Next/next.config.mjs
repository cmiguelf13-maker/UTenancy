
// https://utenancy.com
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async redirects() {
    return [
      {
        // Redirect www → non-www (fixes http://www.utenancy.com 404 in GSC)
        source: '/:path*',
        has: [{ type: 'host', value: 'www.utenancy.com' }],
        destination: 'https://utenancy.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
