/**
 * Content negotiation and 404 resolution for the edge middleware.
 *
 * Pure functions over (pathname, Accept) so the whole routing decision table is
 * testable without a request — see `tests/negotiation.test.ts`. `middleware.ts`
 * is only the part that turns a decision into a Response.
 *
 * Two behaviours live here:
 *
 *   1. **Markdown negotiation.** A caller asking for `text/markdown` gets the
 *      markdown twin of the page it asked for, and the response carries
 *      `Vary: Accept` so a CDN cannot hand the HTML variant to the next agent
 *      (or the markdown variant to the next browser) just because that variant
 *      happened to be cached first.
 *
 *   2. **Agent-recoverable 404s.** An unknown path answers 404 either way. A
 *      client that accepts HTML gets the styled page; anything else — an agent,
 *      a fetch, a curl — gets a short markdown body listing where to look next,
 *      because an HTML error page tells an agent nothing it can act on.
 */

import { ROUTE_BY_PATH } from "../generated/route-manifest"
import { RECOVERY_LINKS, SITE_URL } from "../content/recovery-links"

export const VARY_VALUE = "Accept, Accept-Encoding"

export type Decision =
  /** Do nothing — let the platform serve this untouched. */
  | { kind: "pass" }
  /** Serve normally, but mark the response as varying on Accept. */
  | { kind: "vary" }
  /** Internally rewrite to the markdown twin. */
  | { kind: "rewrite"; to: string }
  /** Unknown path, markdown-preferring client: 404 with a recoverable body. */
  | { kind: "not-found-markdown"; body: string }

// ---------------------------------------------------------------------------
// Accept parsing
// ---------------------------------------------------------------------------

type MediaRange = { type: string; q: number }

function parseAccept(header: string | null | undefined): MediaRange[] {
  if (!header) return []
  return header
    .split(",")
    .map((part) => {
      const [type, ...parameters] = part.trim().split(";")
      const qParameter = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="))
      const q = qParameter ? Number.parseFloat(qParameter.slice(2)) : 1
      return {
        type: type.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 1,
      }
    })
    .filter((range) => range.type !== "")
}

function qualityOf(ranges: MediaRange[], mediaType: string): number {
  const [group] = mediaType.split("/")
  let best = -1
  for (const range of ranges) {
    if (
      range.type === mediaType ||
      range.type === `${group}/*` ||
      range.type === "*/*"
    ) {
      // An exact match wins over a wildcard at the same q, which is what makes
      // `text/markdown, */*` mean "markdown please" rather than "anything".
      const specificity = range.type === mediaType ? 2 : range.type === "*/*" ? 0 : 1
      const score = range.q * 10 + specificity
      if (score > best) best = score
    }
  }
  return best
}

/**
 * True when the caller has explicitly asked for markdown and has not ranked
 * HTML above it. `text/html,...,*\/*;q=0.8` (every browser) is false; a bare
 * `*\/*` is false too — a wildcard is not a request for markdown.
 */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  const ranges = parseAccept(accept)
  const explicitMarkdown = ranges.some(
    (range) => range.type === "text/markdown" && range.q > 0
  )
  if (!explicitMarkdown) return false
  return qualityOf(ranges, "text/markdown") >= qualityOf(ranges, "text/html")
}

/** True when the caller can render an HTML page — i.e. it is probably a browser. */
export function acceptsHtml(accept: string | null | undefined): boolean {
  const ranges = parseAccept(accept)
  return ranges.some(
    (range) =>
      (range.type === "text/html" || range.type === "application/xhtml+xml") &&
      range.q > 0
  )
}

// ---------------------------------------------------------------------------
// The markdown 404 body
// ---------------------------------------------------------------------------

export function notFoundMarkdown(pathname: string): string {
  return [
    "# 404 — Not Found",
    "",
    `No page exists at \`${pathname}\` on ${SITE_URL}. Nothing was moved: this`,
    "URL has never resolved.",
    "",
    "## Where to look next",
    "",
    ...RECOVERY_LINKS.map(
      (link) => `- [${link.label}](${SITE_URL}${link.href}) — ${link.description}`
    ),
    "",
    "## Notes",
    "",
    "- Every documentation page has a markdown twin: append `.md` to its URL, or",
    "  send `Accept: text/markdown` to the HTML URL.",
    "- The JSON API is at `/api` and always answers with JSON, including errors.",
    "",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

/** Trailing slashes are not significant; `/docs/` and `/docs` are one route. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed
}

const HAS_EXTENSION = /\.[a-z0-9]+$/i

export function negotiate(
  pathname: string,
  accept: string | null | undefined
): Decision {
  const path = normalizePath(pathname)

  // The API owns its own content types, caching and error shapes.
  if (path === "/api" || path.startsWith("/api/")) return { kind: "pass" }

  // Anything with a file extension is a concrete file — markdown twins, the
  // OpenAPI documents, llms.txt, assets. Serve it as-is.
  if (HAS_EXTENSION.test(path)) return { kind: "pass" }

  // Reserved namespaces that resolve to functions or static files.
  if (path.startsWith("/.well-known")) return { kind: "pass" }

  const route = ROUTE_BY_PATH[path]

  if (route) {
    if (route.markdown && prefersMarkdown(accept)) {
      return { kind: "rewrite", to: route.markdown }
    }
    return { kind: "vary" }
  }

  // Unknown path. A browser gets the styled 404 page the platform already
  // serves with a 404 status; everything else gets markdown it can act on.
  if (acceptsHtml(accept)) return { kind: "pass" }
  return { kind: "not-found-markdown", body: notFoundMarkdown(path) }
}
