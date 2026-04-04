'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#listings',      label: 'Find Housing' },
  { href: '/#landlords',     label: 'For Landlords' },
  { href: '/#pricing',       label: 'Pricing' },
]

export default function Nav() {
  const path = usePathname()
  const isAuth = path === '/auth'

  return (
    <nav className="sticky top-0 z-50 glass border-b border-out-var/20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 clay-grad rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-white font-head font-black text-sm leading-none">U</span>
          </div>
          <span className="font-head font-black text-xl text-clay-dark tracking-tight">Tenancy</span>
        </Link>

        {/* Desktop links */}
        {!isAuth && (
          <div className="hidden md:flex items-center gap-8 text-sm font-head font-semibold">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className="text-muted hover:text-clay transition-colors">
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-3">
          {isAuth ? (
            <>
              <span className="text-sm font-head font-medium text-muted">Need help?</span>
              <a href="mailto:support@utenancy.com" className="clay-grad text-white px-5 py-2.5 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all">
                Contact Us
              </a>
            </>
          ) : (
            <>
              <Link href="/auth" className="hidden md:block text-sm font-head font-semibold text-clay-dark px-2 hover:text-clay transition-colors">
                Sign In
              </Link>
              <Link href="/#waitlist" className="clay-grad text-white px-5 py-2.5 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all active:scale-95">
                Get Early Access
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
