/**
 * Vercel Edge Middleware — content negotiation and agent-recoverable 404s.
 *
 * Runs before Vercel's filesystem matching, which is why the negotiation lives
 * here rather than as a `has`-conditioned rewrite in vercel.json: those
 * rewrites are silently bypassed for prerendered HTML routes (/docs/installation
 * resolves to dist/docs/installation/index.html via cleanUrls before user
 * rewrites get a chance to fire).
 *
 * All of the routing logic is in `src/server/negotiation.ts` and unit-tested
 * there; this file only turns a decision into a Response.
 */
import { next, rewrite } from "@vercel/edge"
import { negotiate, VARY_VALUE } from "./src/server/negotiation"

export const config = {
  // Only paths that can actually be negotiated, because every invocation of
  // this middleware is a billable function invocation. Excluded:
  //
  //   assets/         hashed bundles — immutable, never negotiated
  //   api/            sets its own content types, caching and Vary
  //   anything.ext    a concrete file (llms.txt, favicon.svg, og.png, the .md
  //                   twins, openapi.json) — `negotiate` passes these through
  //                   untouched, so matching them would cost an invocation to
  //                   decide to do nothing
  //
  // That leaves extensionless paths: the pages, and the unknown paths that
  // need an agent-readable 404. `negotiate` still guards all three cases, so
  // the matcher is an optimisation rather than the rule.
  matcher: ["/((?!assets/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url)
  const decision = negotiate(url.pathname, request.headers.get("accept"))

  switch (decision.kind) {
    case "pass":
      return next()

    case "vary":
      // The HTML variant of a negotiated URL. Without this header a CDN can
      // serve whichever variant it cached first to everyone.
      return next({ headers: { Vary: VARY_VALUE } })

    case "rewrite":
      return rewrite(new URL(decision.to, url), {
        headers: { Vary: VARY_VALUE },
      })

    case "not-found-markdown":
      return new Response(decision.body, {
        status: 404,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=60",
          Vary: VARY_VALUE,
          "X-Robots-Tag": "noindex",
        },
      })

    case "not-acceptable":
      // Never cached: the same URL answers 200 for the next client with a
      // different Accept, and a shared cache keyed on this one would be wrong
      // for everybody else.
      return new Response(decision.body, {
        status: 406,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          Vary: VARY_VALUE,
          "X-Robots-Tag": "noindex",
        },
      })
  }
}
