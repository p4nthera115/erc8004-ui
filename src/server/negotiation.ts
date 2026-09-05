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
  /** The page exists but none of its representations satisfies Accept. */
  | { kind: "not-acceptable"; body: string }

/** Media types a documentation page can be served as. */
export const HTML_TYPE = "text/html"
export const MARKDOWN_TYPE = "text/markdown"

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

/**
 * Whether the caller will accept `mediaType` at all.
 *
 * RFC 9110 §12.5.1: the most specific media range that matches decides, so
 * `text/markdown;q=0, *\/*` rejects markdown even though the wildcard would
 * have allowed it. A missing or empty header is "no constraint", not "nothing
 * works", and always accepts.
 */
export function acceptsType(
  accept: string | null | undefined,
  mediaType: string
): boolean {
  const ranges = parseAccept(accept)
  if (ranges.length === 0) return true

  const [group] = mediaType.split("/")
  let bestSpecificity = -1
  let q = 0
  for (const range of ranges) {
    const specificity =
      range.type === mediaType
        ? 2
        : range.type === `${group}/*`
          ? 1
          : range.type === "*/*"
            ? 0
            : -1
    if (specificity > bestSpecificity) {
      bestSpecificity = specificity
      q = range.q
    }
  }
  return bestSpecificity >= 0 && q > 0
}

/**
 * True when none of the representations this URL can produce is acceptable to
 * the caller — the only case where 406 is the right answer. Deliberately
 * conservative: a missing header, a bare wildcard, or one matching offer is
 * enough to serve something.
 */
export function isNotAcceptable(
  accept: string | null | undefined,
  offered: readonly string[]
): boolean {
  if (!accept || accept.trim() === "") return false
  return !offered.some((mediaType) => acceptsType(accept, mediaType))
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
// The 406 body
// ---------------------------------------------------------------------------

/**
 * RFC 9110 §15.5.7 recommends that a 406 lists the representations that *are*
 * available, so the client can pick one and retry. Plain text rather than
 * markdown: the caller has just told us it does not accept markdown.
 */
export function notAcceptableText(
  pathname: string,
  offered: readonly string[],
  accept: string | null | undefined,
  /** Public path of this page's markdown twin — the one a caller can fetch. */
  markdownPath: string | null
): string {
  return [
    "406 Not Acceptable",
    "",
    `${SITE_URL}${pathname} is available as:`,
    ...offered.map((mediaType) =>
      mediaType === MARKDOWN_TYPE && markdownPath
        ? `- ${mediaType} (also served at ${SITE_URL}${markdownPath})`
        : `- ${mediaType}`
    ),
    "",
    `You sent: Accept: ${accept ?? "(none)"}`,
    "",
    "Retry with one of the media types above, or omit the Accept header to get",
    "the default representation. Sending `Accept: text/markdown` returns this",
    "page as Markdown.",
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
    const offered = route.markdown ? [HTML_TYPE, MARKDOWN_TYPE] : [HTML_TYPE]

    // The page exists, but the caller accepts neither of the things it can be.
    // Answering with HTML anyway would hand an agent bytes it has said it
    // cannot parse; 406 tells it exactly what to ask for instead.
    if (isNotAcceptable(accept, offered)) {
      // The twin's *public* path, not the file the rewrite points at: a caller
      // that has just been refused needs a URL it can type, and the internal
      // /llms/... layout is an implementation detail.
      const markdownPath = route.markdown
        ? path === "/"
          ? "/llms.txt"
          : `${path}.md`
        : null
      return {
        kind: "not-acceptable",
        body: notAcceptableText(path, offered, accept, markdownPath),
      }
    }

    if (route.markdown && prefersMarkdown(accept)) {
      return { kind: "rewrite", to: route.markdown }
    }
    return { kind: "vary" }
  }

  // Unknown path. A browser gets the styled 404 page the platform already
  // serves with a 404 status; everything else gets markdown it can act on.
  // The HTML branch is `vary`, not `pass`: this URL answers with two different
  // content types depending on Accept, so the 404 has to be marked as
  // negotiated exactly like a page that exists.
  if (acceptsHtml(accept)) return { kind: "vary" }
  return { kind: "not-found-markdown", body: notFoundMarkdown(path) }
}
