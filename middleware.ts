import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * UTenancy route-protection middleware.
 *
 * Rules:
 *  - Unauthenticated → redirect to /auth for any protected route
 *  - Non-landlord    → redirect to /  when accessing /landlord
 *  - Landlord        → redirect to /  when accessing /interested
 *
 * Protected paths: /profile, /interested, /messages, /landlord
 */
export async function middleware(request: NextRequest) {
  // Build a mutable response so Supabase SSR can refresh session cookies
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror into the request first so downstream middleware sees them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT server-side (not just from cookies)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Unauthenticated: block all protected routes ──
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  const role = user.user_metadata?.role ?? 'student'

  // ── /landlord → landlord-only ──
  if (pathname.startsWith('/landlord') && role !== 'landlord') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── /interested → students only ──
  if (pathname.startsWith('/interested') && role === 'landlord') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── /post-room → students only ──
  if (pathname.startsWith('/post-room') && role === 'landlord') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Only run on the routes that need protection
  matcher: [
    '/profile/:path*',
    '/interested/:path*',
    '/messages/:path*',
    '/landlord/:path*',
    '/post-room/:path*',
  ],
}
