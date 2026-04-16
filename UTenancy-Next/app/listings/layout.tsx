import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Student Housing',
  description: 'Find verified off-campus apartments, open rooms, and group housing near your university. Filter by price, bedrooms, and distance.',
  alternates: {
    canonical: 'https://utenancy.com/listings',
  },
  openGraph: {
    title: 'Browse Student Housing — UTenancy',
    description: 'Find verified off-campus apartments, open rooms, and group housing near your university.',
    url: 'https://utenancy.com/listings',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
