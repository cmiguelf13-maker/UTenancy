import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Fraunces, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

/* ── Google Fonts via next/font (zero layout shift) ── */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-be-vietnam',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://utenancy.com'),
  title: {
    default: 'UTenancy — Student Housing, Reimagined',
    template: '%s | UTenancy',
  },
  description:
    'UTenancy connects verified university students with real off-campus housing and roommates — and gives landlords a management platform to run it all.',
  keywords: ['student housing', 'off-campus', 'roommates', 'university', 'rent', 'college housing', 'student apartments'],
  openGraph: {
    type: 'website',
    siteName: 'UTenancy',
    title: 'UTenancy — Student Housing, Reimagined',
    description: 'Find verified off-campus housing near your university. Browse real listings and connect with roommates.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UTenancy — Student Housing, Reimagined',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UTenancy — Student Housing, Reimagined',
    description: 'Find verified off-campus housing near your university. Browse real listings and connect with roommates.',
    images: ['/og-image.png'],
  },
}

/* ── Site-level structured data (sitewide, server-rendered) ── */
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'UTenancy',
  url: 'https://utenancy.com',
  description: 'UTenancy connects verified university students with real off-campus housing and roommates — and gives landlords a management platform to run it all.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://utenancy.com/listings?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'UTenancy',
  url: 'https://utenancy.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://utenancy.com/logo.png',
  },
  description: 'UTenancy connects verified university students with real off-campus housing and roommates.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${fraunces.variable} ${beVietnam.variable}`}
    >
      <head>
        {/* Preconnect to Google Fonts domains for faster icon font load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        {/* Site-level structured data — WebSite (enables SearchAction) + Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-body bg-cream text-stone antialiased">
        <Nav />
        {children}
      </body>
    </html>
  )
}
