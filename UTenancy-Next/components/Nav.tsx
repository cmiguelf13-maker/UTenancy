'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const links = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#listings',      label: 'Find Housing' },
  { href: '/#landlords',     label: 'For Landlords' },
  { href: '/#pricing',       label: 'Pricing' },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? ''
}

export default function Nav() {
  const path    = usePathname()
  const router  = useRouter()
  const isAuth  = path === '/auth'
  const isLandlordPortal = path === '/landlord'

  const [user, setUser]           = useState<User | null>(null)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Detect session on mount + listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.refresh()
  }

  // Don't render Nav on landlord portal — it has its own header
  if (isLandlordPortal) return null

  const fullName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ''}`.trim()
    : (user?.email?.split('@')[0] ?? '')

  const initials  = fullName ? getInitials(fullName) : '?'
  const firstName = fullName ? getFirstName(fullName) : ''

  return (
    <nav className="sticky top-0 z-50 glass border-b border-out-var/20">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-3.5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="UTenancy" className="h-8 w-auto" />
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

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger — shown only when not on auth page */}
          {!isAuth && (
            <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl hover:bg-surf-lo transition-colors gap-[5px]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <span className={`block w-5 h-[2px] bg-clay-dark rounded-full transition-all duration-200 origin-center ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block w-5 h-[2px] bg-clay-dark rounded-full transition-all duration-200 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-[2px] bg-clay-dark rounded-full transition-all duration-200 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          )}
          {isAuth ? (
            <>
              <span className="text-sm font-head font-medium text-muted">Need help?</span>
              <a href="mailto:support@utenancy.com" className="clay-grad text-white px-5 py-2.5 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all">
                Contact Us
              </a>
            </>
          ) : user ? (
            /* ── LOGGED-IN STATE ── */
            <>
              {/* Landlord: portal shortcut */}
              {user.user_metadata?.role === 'landlord' && (
                <Link href="/landlord"
                  className="hidden md:flex items-center gap-1.5 text-sm font-head font-semibold text-clay-dark border border-out-var bg-surf-hi px-4 py-2 rounded-full hover:border-clay/50 hover:bg-linen transition-all">
                  <span className="material-symbols-outlined text-base text-clay">domain</span>
                  My Portal
                </Link>
              )}

              {/* Student: messaging icon */}
              {user.user_metadata?.role !== 'landlord' && (
                <Link href="/messages" title="Messages"
                  className="w-10 h-10 flex items-center justify-center rounded-full text-clay hover:bg-linen transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </Link>
              )}

              {/* Profile avatar + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 bg-surf-hi border border-out-var rounded-full pl-1 pr-3 py-1 hover:border-clay/50 hover:bg-linen transition-all"
                >
                  <div className="w-8 h-8 rounded-full flex-shrink-0 shadow-sm overflow-hidden">
                    <div className="w-full h-full clay-grad flex items-center justify-center">
                      <span className="text-white font-head font-black text-xs">{initials}</span>
                    </div>
                  </div>
                  <span className="text-sm font-head font-semibold text-clay-dark hidden md:block">{firstName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`text-outline transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-out-var/60 py-2 z-50"
                    style={{ boxShadow: '0 16px 48px rgba(81,53,38,.14)' }}>
                    {/* User info header */}
                    <div className="px-4 py-2 mb-1 border-b border-out-var/40">
                      <p className="text-xs font-head font-black text-clay-dark">{fullName}</p>
                      <p className="text-[11px] font-body text-muted truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-espresso hover:bg-surf-lo transition-colors">
                      <span className="material-symbols-outlined text-clay text-lg">manage_accounts</span>
                      My Profile
                    </Link>
                    {user.user_metadata?.role === 'landlord' ? (
                      <Link href="/landlord" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-espresso hover:bg-surf-lo transition-colors">
                        <span className="material-symbols-outlined text-clay text-lg">domain</span>
                        My Portal
                      </Link>
                    ) : (
                      <>
                        <Link href="/interested" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-espresso hover:bg-surf-lo transition-colors">
                          <span className="material-symbols-outlined text-clay text-lg">favorite</span>
                          Interested Properties
                        </Link>
                        <Link href="/tenant/household" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-espresso hover:bg-surf-lo transition-colors">
                          <span className="material-symbols-outlined text-clay text-lg">house</span>
                          My Household
                        </Link>
                        <Link href="/my-listings" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-espresso hover:bg-surf-lo transition-colors">
                          <span className="material-symbols-outlined text-clay text-lg">home_work</span>
                          My Listings
                        </Link>
                        <Link href="/post-room" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-espresso hover:bg-surf-lo transition-colors">
                          <span className="material-symbols-outlined text-clay text-lg">add_home</span>
                          Post a Room
                        </Link>
                      </>
                    )}
                    <div className="border-t border-out-var/40 my-1.5" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-head font-semibold text-red-600 hover:bg-red-50 transition-colors">
                      <span className="material-symbols-outlined text-red-500 text-lg">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── LOGGED-OUT STATE ── */
            <>
              <Link href="/auth" className="hidden md:inline-flex clay-grad text-white px-5 py-2.5 rounded-full font-head text-sm font-bold shadow-md hover:opacity-90 transition-all active:scale-95">
                Sign In
              </Link>
            </>
          )}
        </div>

      </div>

      {/* ── MOBILE NAV PANEL ──────────────────────────────── */}
      {!isAuth && mobileOpen && (
        <div className="md:hidden border-t border-out-var/20 bg-white/95 backdrop-blur-md px-4 py-3 space-y-0.5 shadow-lg">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center py-3 px-3 text-sm font-head font-semibold text-clay-dark rounded-xl hover:bg-surf-lo transition-colors"
            >
              {label}
            </Link>
          ))}
          {user?.user_metadata?.role === 'landlord' && (
            <Link
              href="/landlord"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 px-3 text-sm font-head font-semibold text-clay rounded-xl hover:bg-surf-lo transition-colors"
            >
              <span className="material-symbols-outlined text-base">domain</span>
              My Portal
            </Link>
          )}
          {!user && (
            <div className="pt-2 mt-1 border-t border-out-var/20">
              <Link
                href="/auth"
                onClick={() => setMobileOpen(false)}
                className="clay-grad flex items-center justify-center text-white py-3 rounded-xl font-head font-bold text-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
