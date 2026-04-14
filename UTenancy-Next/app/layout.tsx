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
  title: {
    default: 'UTenancy — Student Housing, Reimagined',
    template: '%s | UTenancy',
  },
  description:
    'UTenancy connects verified university students with real off-campus housing and roommates — and gives landlords a management platform to run it all.',
  keywords: ['student housing', 'off-campus', 'roommates', 'university', 'rent'],
  openGraph: {
    type: 'website',
    siteName: 'UTenancy',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${fraunces.variable} ${beVietnam.variable}`}
    >
      <head>
        {/* Material Symbols icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="font-body bg-cream text-stone antialiased">
        <Nav />
        {children}
      </body>
    </html>
  )
}
