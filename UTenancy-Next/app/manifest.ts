import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UTenancy',
    short_name: 'UTenancy',
    description: 'Student Housing, Reimagined',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf5f2',
    theme_color: '#9c7060',
    icons: [
      {
        src: '/apple-touch-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
