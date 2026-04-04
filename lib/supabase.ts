import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Use this in Client Components (anything with 'use client').
 * For Server Components / Route Handlers, use createServerClient from @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * Validate that an email address ends with a .edu TLD.
 * Also blocks common tricks like "foo@bar.edu.fake.com".
 */
export function isEduEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.edu$/i.test(email.trim())
}
