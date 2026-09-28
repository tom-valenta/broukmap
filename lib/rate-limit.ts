import "server-only";

type Bucket = { count: number; resetAt: number };
type RateLimit = { limit: number; windowMs: number };
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (!oldest) break;
    buckets.delete(oldest);
  }
}

/**
 * Process-local fixed-window limiter for inexpensive abuse protection.
 * Deploy a shared store at the edge when multiple server instances need one
 * global quota.
 */
export function takeRateLimit(key: string, { limit, windowMs }: RateLimit, now = Date.now()): RateLimitResult {
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  if (bucket.count >= limit) return { allowed: false, remaining: 0, retryAfterSeconds };
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds };
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
  return {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.retryAfterSeconds),
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

/** Uses only a transient request key; the app does not persist client IPs. */
export function clientRateLimitKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",", 1)[0]?.trim();
  return ip && ip.length <= 128 ? ip : "unknown-client";
}
