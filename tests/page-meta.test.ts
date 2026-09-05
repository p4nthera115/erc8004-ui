/**
 * Per-route document metadata.
 *
 * The site prerenders every route from one index.html, so without this
 * resolution every page would ship an identical title, description and
 * canonical URL — which is exactly what the metadata-completeness check
 * penalises. Only the pure resolution is tested here; `applyPageMeta` is the
 * thin DOM half, exercised by the prerendered output at build time.
 */
import { describe, expect, it } from "vitest"
import { resolvePageMeta } from "../src/lib/page-meta"
import { ROUTE_MANIFEST } from "../src/generated/route-manifest"

const SITE_URL = "https://erc8004-ui.vercel.app"

describe("resolvePageMeta", () => {
  it("gives the homepage its own canonical and the index as its markdown twin", () => {
    const meta = resolvePageMeta("/")
    expect(meta.canonical).toBe(`${SITE_URL}/`)
    expect(meta.markdown).toBe(`${SITE_URL}/llms.txt`)
    expect(meta.indexable).toBe(true)
  })

  it("gives every route a distinct canonical URL", () => {
    const canonicals = ROUTE_MANIFEST.filter((route) => route.priority > 0).map(
      (route) => resolvePageMeta(route.path).canonical
    )
    expect(new Set(canonicals).size).toBe(canonicals.length)
  })

  it("gives every route a distinct title", () => {
    const titles = ROUTE_MANIFEST.map((route) => resolvePageMeta(route.path).title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it("does not repeat the product name when the page name already carries it", () => {
    expect(resolvePageMeta("/about").title).toBe("About @p4n/erc8004-ui")
  })

  it("points a docs page at its own .md twin", () => {
    expect(resolvePageMeta("/docs/components/agent-card").markdown).toBe(
      `${SITE_URL}/docs/components/agent-card.md`
    )
    expect(resolvePageMeta("/privacy").markdown).toBe(`${SITE_URL}/privacy.md`)
  })

  it("ignores a trailing slash", () => {
    expect(resolvePageMeta("/about/")).toEqual(resolvePageMeta("/about"))
  })

  it("marks an unknown path noindex and gives it no canonical", () => {
    const meta = resolvePageMeta("/not-a-page")
    expect(meta.indexable).toBe(false)
    expect(meta.canonical).toBeNull()
    expect(meta.title).toContain("404")
  })
})
