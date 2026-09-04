/**
 * Content negotiation and 404 behaviour — the decision table `middleware.ts`
 * turns into responses.
 */
import { describe, expect, it } from "vitest"
import {
  acceptsHtml,
  negotiate,
  normalizePath,
  notFoundMarkdown,
  prefersMarkdown,
} from "../src/server/negotiation"
import { ROUTE_MANIFEST } from "../src/generated/route-manifest"
import { RECOVERY_LINKS } from "../src/content/recovery-links"

const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"

describe("prefersMarkdown", () => {
  it("is true for a bare text/markdown request", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true)
  })

  it("is true when markdown is listed alongside a wildcard", () => {
    expect(prefersMarkdown("text/markdown, */*")).toBe(true)
  })

  it("is false for a browser Accept header", () => {
    expect(prefersMarkdown(BROWSER_ACCEPT)).toBe(false)
  })

  it("is false for a bare wildcard — curl's default is not a markdown request", () => {
    expect(prefersMarkdown("*/*")).toBe(false)
    expect(prefersMarkdown(null)).toBe(false)
  })

  it("respects q-values when html outranks markdown", () => {
    expect(prefersMarkdown("text/markdown;q=0.1, text/html;q=0.9")).toBe(false)
    expect(prefersMarkdown("text/markdown;q=0.9, text/html;q=0.1")).toBe(true)
  })

  it("ignores markdown offered at q=0", () => {
    expect(prefersMarkdown("text/markdown;q=0, text/html")).toBe(false)
  })
})

describe("acceptsHtml", () => {
  it("recognises browsers", () => {
    expect(acceptsHtml(BROWSER_ACCEPT)).toBe(true)
    expect(acceptsHtml("text/html")).toBe(true)
  })

  it("does not treat a wildcard or a missing header as an HTML client", () => {
    expect(acceptsHtml("*/*")).toBe(false)
    expect(acceptsHtml(null)).toBe(false)
    expect(acceptsHtml("application/json")).toBe(false)
  })
})

describe("normalizePath", () => {
  it("collapses trailing slashes", () => {
    expect(normalizePath("/docs/")).toBe("/docs")
    expect(normalizePath("/docs///")).toBe("/docs")
    expect(normalizePath("/")).toBe("/")
    expect(normalizePath("")).toBe("/")
  })
})

describe("negotiate", () => {
  it("rewrites a known page to its markdown twin", () => {
    expect(negotiate("/docs/installation", "text/markdown")).toEqual({
      kind: "rewrite",
      to: "/llms/_guides/installation.md",
    })
    expect(negotiate("/docs/components/agent-card", "text/markdown")).toEqual({
      kind: "rewrite",
      to: "/llms/agent-card.md",
    })
  })

  it("serves the homepage's markdown twin — the documentation index", () => {
    expect(negotiate("/", "text/markdown")).toEqual({
      kind: "rewrite",
      to: "/llms.txt",
    })
  })

  it("rewrites the standalone pages", () => {
    expect(negotiate("/privacy", "text/markdown")).toEqual({
      kind: "rewrite",
      to: "/llms/_pages/privacy.md",
    })
  })

  it("marks the HTML variant of a negotiated URL as varying on Accept", () => {
    // Without this a CDN can hand the cached markdown to a browser, or the
    // cached HTML to the next agent asking for markdown.
    expect(negotiate("/docs/installation", BROWSER_ACCEPT)).toEqual({
      kind: "vary",
    })
    expect(negotiate("/", BROWSER_ACCEPT)).toEqual({ kind: "vary" })
  })

  it("ignores trailing slashes when resolving a route", () => {
    expect(negotiate("/docs/installation/", "text/markdown")).toEqual({
      kind: "rewrite",
      to: "/llms/_guides/installation.md",
    })
  })

  it("leaves the API alone — it owns its own content types and errors", () => {
    expect(negotiate("/api", "text/markdown")).toEqual({ kind: "pass" })
    expect(negotiate("/api/components/agent-card", "text/markdown")).toEqual({
      kind: "pass",
    })
  })

  it("leaves concrete files and .well-known alone", () => {
    expect(negotiate("/llms.txt", "text/markdown")).toEqual({ kind: "pass" })
    expect(negotiate("/openapi.json", "*/*")).toEqual({ kind: "pass" })
    expect(negotiate("/docs/components/agent-card.md", "*/*")).toEqual({
      kind: "pass",
    })
    expect(negotiate("/.well-known/mcp", "*/*")).toEqual({ kind: "pass" })
  })

  it("lets a browser fall through to the styled 404 page", () => {
    // `vary`, not `pass` — the platform still serves 404.html, but the same
    // URL answers markdown to a different Accept, so the response has to say
    // it varies or a CDN can hand one audience the other's variant.
    expect(negotiate("/nope", BROWSER_ACCEPT)).toEqual({ kind: "vary" })
  })

  it("answers a non-HTML client with a recoverable markdown 404", () => {
    for (const accept of [null, "*/*", "text/markdown", "application/json"]) {
      const decision = negotiate("/some-path-that-does-not-exist", accept)
      expect(decision.kind).toBe("not-found-markdown")
    }
  })
})

describe("notFoundMarkdown", () => {
  const body = notFoundMarkdown("/nope")

  it("names the path that failed", () => {
    expect(body).toContain("/nope")
  })

  it("is markdown, not prose", () => {
    expect(body).toMatch(/^# 404 — Not Found/)
    expect(body).toContain("## Where to look next")
  })

  it("points at every recovery entry point the HTML page lists", () => {
    for (const link of RECOVERY_LINKS) {
      expect(body).toContain(link.href)
    }
  })

  it("names the indexes an agent needs to re-orient", () => {
    expect(body).toContain("/llms.txt")
    expect(body).toContain("/sitemap.xml")
    expect(body).toContain("/openapi.json")
  })
})

describe("route manifest", () => {
  it("gives every route a title, a description and a sane priority", () => {
    for (const route of ROUTE_MANIFEST) {
      expect(route.path.startsWith("/"), route.path).toBe(true)
      expect(route.title.length, route.path).toBeGreaterThan(0)
      expect(route.description.length, route.path).toBeGreaterThan(0)
      expect(route.priority).toBeGreaterThanOrEqual(0)
      expect(route.priority).toBeLessThanOrEqual(1)
    }
  })

  it("has no duplicate paths", () => {
    const paths = ROUTE_MANIFEST.map((route) => route.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("names the product in every title, so a name query can match a page", () => {
    for (const route of ROUTE_MANIFEST) {
      expect(route.title, route.path).toContain("@erc8004/ui")
    }
  })
})
