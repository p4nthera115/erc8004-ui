/**
 * Fair-use rate limiting for the /api docs API, and the headers that let a
 * caller see where it stands without having to be told by a 429.
 *
 * The counter is a fixed window held in the function instance's memory. That
 * is deliberately modest: Vercel may run several instances concurrently, so
 * the true ceiling is the policy multiplied by however many instances are
 * warm. It is enough to stop a runaway loop from one client, and — the point
 * of the exercise — it means the advertised numbers describe something real
 * rather than being decorative.
 *
 * Headers follow draft-ietf-httpapi-ratelimit-headers (the RateLimit /
 * RateLimit-Policy structured fields), with the older RateLimit-Limit /
 * -Remaining / -Reset triple emitted alongside them because plenty of clients
 * and scanners still only understand that spelling. Both describe the same
 * window, so a client reading either gets the same answer.
 */

/** Requests allowed per window, per client, per instance. */
export const RATE_LIMIT = 300

/** Window length in seconds. */
export const RATE_WINDOW_SECONDS = 60

/** Name of the policy, as it appears in the structured-field headers. */
export const RATE_POLICY_NAME = "default"

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

/**
 * Keeps the map from growing without bound on a long-lived instance. Cheap
 * because it only runs when the map is already large.
 */
function prune(now: number): void {
  if (windows.size < 5000) return
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

/**
 * The caller's identity for rate-limiting purposes. `x-forwarded-for` is set
 * by Vercel's edge and its first entry is the real client; the rest is
 * client-supplied and not trustworthy. An unidentifiable caller shares one
 * bucket, which is the conservative choice.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return request.headers.get("x-real-ip")?.trim() || "anonymous"
}

export type RateLimitState = {
  limit: number
  remaining: number
  /** Seconds until the window resets. */
  reset: number
  exceeded: boolean
}

/**
 * Counts one request against the caller's window and reports the resulting
 * state. Call it exactly once per request — it mutates the counter.
 */
export function consume(request: Request, now = Date.now()): RateLimitState {
  prune(now)

  const key = clientKey(request)
  const existing = windows.get(key)
  const window: Window =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + RATE_WINDOW_SECONDS * 1000 }

  window.count += 1
  windows.set(key, window)

  const reset = Math.max(0, Math.ceil((window.resetAt - now) / 1000))
  return {
    limit: RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - window.count),
    reset,
    exceeded: window.count > RATE_LIMIT,
  }
}

/** Test seam — the counters are module state, so they outlive a single test. */
export function resetRateLimits(): void {
  windows.clear()
}

/**
 * The headers describing `state`. Emitted on every response, not only on a
 * 429, so a well-behaved agent can slow down before it is refused.
 */
export function rateLimitHeaders(state: RateLimitState): Record<string, string> {
  return {
    // draft-ietf-httpapi-ratelimit-headers: the quota policy, then this
    // caller's position within it.
    "RateLimit-Policy": `"${RATE_POLICY_NAME}";q=${state.limit};w=${RATE_WINDOW_SECONDS}`,
    RateLimit: `"${RATE_POLICY_NAME}";r=${state.remaining};t=${state.reset}`,
    // The earlier, still widely-implemented spelling of the same window.
    "RateLimit-Limit": String(state.limit),
    "RateLimit-Remaining": String(state.remaining),
    "RateLimit-Reset": String(state.reset),
  }
}
