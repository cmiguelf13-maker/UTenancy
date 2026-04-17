/**
 * Simple in-memory rate limiter.
 *
 * ⚠️  LIMITATION: Each Vercel serverless instance has its own memory, so limits
 *     are per-instance rather than globally enforced. This still stops the vast
 *     majority of bots and burst abuse. For strict global rate limiting, swap
 *     this out for Upstash Redis:
 *       1. Create a free Redis DB at https://console.upstash.com
 *       2. Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to Vercel env vars
 *       3. npm install @upstash/ratelimit @upstash/redis
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check whether a request identified by `key` is within the allowed rate.
 *
 * @param key         - Unique identifier (e.g. "waitlist:1.2.3.4")
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs    - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // Start a new window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * Extracts the best-effort client IP from a Next.js Request.
 * Falls back to 'unknown' if no IP header is present.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
