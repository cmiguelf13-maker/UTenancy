import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for use in Server Components & Route Handlers.
 * Uses the service-role key when available, otherwise the anon key.
 * NOT for browser use — does not handle cookies / auth sessions.
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
