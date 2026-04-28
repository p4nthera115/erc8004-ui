/**
 * Vercel Edge Middleware — content negotiation for /docs/*.
 *
 * When an agent requests a docs URL with `Accept: text/markdown`, internally
 * rewrite to the corresponding generated markdown under /llms/. Edge Middleware
 * runs before Vercel's filesystem matching, which is why this lives here
 * instead of as a `has`-conditioned rewrite in vercel.json — those rewrites
 * are silently bypassed for prerendered HTML routes (e.g. /docs/installation
 * resolves to dist/docs/installation/index.html via cleanUrls before user
 * rewrites get a chance to fire).
 */
import { next, rewrite } from "@vercel/edge"

export const config = {
  matcher: ["/docs", "/docs/:path*"],
}

export default function middleware(request: Request): Response {
  const accept = request.headers.get("accept") ?? ""
  if (!/text\/markdown/i.test(accept)) return next()

  const url = new URL(request.url)
  const path = url.pathname.replace(/\/$/, "") || "/"

  if (path === "/docs") {
    return rewrite(new URL("/llms.txt", url))
  }

  const componentMatch = path.match(/^\/docs\/components\/([^/]+)$/)
  if (componentMatch) {
    return rewrite(new URL(`/llms/${componentMatch[1]}.md`, url))
  }

  const guideMatch = path.match(/^\/docs\/([^/]+)$/)
  if (guideMatch) {
    return rewrite(new URL(`/llms/_guides/${guideMatch[1]}.md`, url))
  }

  return next()
}
