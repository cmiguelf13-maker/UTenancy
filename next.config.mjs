

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'photos.zillowstatic.com' },
    ],
  },
}

export default nextConfig
