/**
 * The published files an agent reads before it reads anything else:
 * llms.txt, agents.md, the sitemap, and the trust-anchor pages.
 *
 * These assert content properties an audit (or a careful reader) checks for —
 * that the when-to-use guidance exists and is specific, that the developer
 * resources are discoverable by name, and that /about, /contact and /privacy
 * say enough to be worth reading.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { SITE_PAGES, SITE_PAGE_ORDER } from "../src/content/site-pages"
import { sitePageMarkdown } from "../scripts/lib/site-pages-markdown"
import { ROUTE_MANIFEST } from "../src/generated/route-manifest"

const REPO_ROOT = join(__dirname, "..")
const SITE_URL = "https://erc8004-ui.vercel.app"
const read = (...parts: string[]) => readFileSync(join(REPO_ROOT, ...parts), "utf8")

describe("llms.txt", () => {
  const llms = read("public", "llms.txt")

  it("keeps the llms.txt shape: an H1, then a blockquote summary", () => {
    const lines = llms.split("\n")
    expect(lines[0]).toBe("# @erc8004/ui")
    expect(lines[2].startsWith("> ")).toBe(true)
  })

  it("says when to use the library and when not to", () => {
    expect(llms).toContain("**When to use this:**")
    expect(llms).toContain("**When not to use it:**")
  })

  it("names the developer resources so they can be found by name", () => {
    expect(llms).toContain("## Developer resources")
    for (const resource of [
      "/agents.md",
      "/openapi.json",
      "/api/mcp",
      "/.well-known/mcp",
    ]) {
      expect(llms, resource).toContain(resource)
    }
  })

  it("links the trust anchor pages", () => {
    expect(llms).toContain("## About this project")
    for (const slug of SITE_PAGE_ORDER) {
      expect(llms).toContain(`${SITE_URL}/${slug}.md`)
    }
  })

  it("uses no headings deeper than the section lists it is allowed", () => {
    // Free prose may not contain headings before the first H2 section.
    const beforeFirstSection = llms.slice(0, llms.indexOf("## Setup"))
    expect(beforeFirstSection.match(/^#{2,}\s/m)).toBeNull()
  })
})

describe("agents.md", () => {
  const agents = read("public", "agents.md")

  it("leads with when-to-use guidance, not marketing", () => {
    expect(agents).toContain("## When to use this")
    expect(agents).toContain("## When not to use this")
    expect(agents.indexOf("## When to use this")).toBeLessThan(
      agents.indexOf("## How to call this")
    )
  })

  it("names concrete jobs rather than generic capabilities", () => {
    for (const phrase of [
      "agent directory",
      "reputation",
      "verification",
      "profile page",
    ]) {
      expect(agents.toLowerCase(), phrase).toContain(phrase)
    }
  })

  it("is specific about the jobs it is wrong for", () => {
    expect(agents).toContain("not building a React UI")
    expect(agents).toContain("write to the registries")
  })

  it("tells an agent how to call every surface", () => {
    for (const surface of [
      `${SITE_URL}/api/mcp`,
      `${SITE_URL}/openapi.json`,
      `${SITE_URL}/llms.txt`,
      "Accept: text/markdown",
      "npx -y @erc8004/ui-mcp",
    ]) {
      expect(agents, surface).toContain(surface)
    }
  })

  it("carries the caveats that make guessing dangerous", () => {
    expect(agents).toContain("valueDeltaSum")
    expect(agents).toContain("isRevoked: false")
    expect(agents).toContain("Validation Registry is not deployed")
  })

  it("discloses the pre-release status rather than burying it", () => {
    expect(agents).toContain("pre-release")
  })
})

describe("trust anchor pages", () => {
  it.each([...SITE_PAGE_ORDER])("/%s has substantial content", (slug) => {
    const page = SITE_PAGES[slug]
    const prose = [
      page.intro,
      ...page.sections.flatMap((section) => [
        ...(section.paragraphs ?? []),
        ...(section.bullets ?? []),
      ]),
    ].join(" ")

    // The threshold an audit uses for "a real page, not a placeholder".
    expect(prose.length, `${slug} prose length`).toBeGreaterThan(500)
    expect(page.description.length).toBeGreaterThan(20)
    expect(page.sections.length).toBeGreaterThanOrEqual(3)
  })

  it("renders to markdown with the same headings the page shows", () => {
    for (const slug of SITE_PAGE_ORDER) {
      const page = SITE_PAGES[slug]
      const markdown = sitePageMarkdown(page, SITE_URL)
      expect(markdown).toContain(`# ${page.title}`)
      for (const section of page.sections) {
        expect(markdown).toContain(`## ${section.heading}`)
      }
      expect(markdown).toContain(`${SITE_URL}/${slug}.md`)
    }
  })

  it("makes relative links absolute in the markdown twin", () => {
    const markdown = sitePageMarkdown(SITE_PAGES.contact, SITE_URL)
    expect(markdown).toContain(`${SITE_URL}/llms.txt`)
    expect(markdown).not.toMatch(/\]\(\/llms\.txt\)/)
  })

  it("publishes the markdown twins the rewrites point at", () => {
    for (const slug of SITE_PAGE_ORDER) {
      const published = read("public", "llms", "_pages", `${slug}.md`)
      expect(published).toContain(`# ${SITE_PAGES[slug].title}`)
    }
  })

  it("privacy discloses the third parties a visitor actually reaches", () => {
    const privacy = read("public", "llms", "_pages", "privacy.md")
    for (const party of ["Vercel", "Umami", "The Graph"]) {
      expect(privacy, party).toContain(party)
    }
  })
})

describe("sitemap.xml", () => {
  const sitemap = read("public", "sitemap.xml")

  it("lists every indexable route from the manifest", () => {
    for (const route of ROUTE_MANIFEST.filter((entry) => entry.priority > 0)) {
      expect(sitemap, route.path).toContain(
        `<loc>${SITE_URL}${route.path === "/" ? "/" : route.path}</loc>`
      )
    }
  })

  it("omits the non-canonical /docs redirect", () => {
    expect(sitemap).not.toContain(`<loc>${SITE_URL}/docs</loc>`)
  })

  it("lists the machine-readable entry points too", () => {
    for (const path of ["/llms.txt", "/llms-full.txt", "/agents.md", "/openapi.json"]) {
      expect(sitemap, path).toContain(`<loc>${SITE_URL}${path}</loc>`)
    }
  })
})

describe("robots.txt", () => {
  const robots = read("public", "robots.txt")

  it("allows everything and points at the sitemap", () => {
    expect(robots).toContain("User-agent: *")
    expect(robots).toContain("Allow: /")
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it("names the machine-readable entry points", () => {
    for (const path of ["/agents.md", "/llms.txt", "/openapi.json", "/api/mcp"]) {
      expect(robots, path).toContain(path)
    }
  })

  it("disallows nothing — this site has nothing to hide from a crawler", () => {
    expect(robots).not.toMatch(/^Disallow:\s*\S/m)
  })
})

describe("prerendered routes", () => {
  const viteConfig = read("vite.config.ts")

  it("prerenders every HTML route in the manifest", () => {
    // A route missing here ships as an empty SPA shell to any crawler that
    // does not run JavaScript.
    for (const route of ROUTE_MANIFEST) {
      if (route.kind === "index") continue
      expect(viteConfig, route.path).toContain(`"${route.path}"`)
    }
  })

  it("prerenders the 404 page the platform serves for unmatched paths", () => {
    expect(viteConfig).toContain('"/404"')
  })
})

describe("index.html metadata", () => {
  const html = read("index.html")

  it("carries all four entity-resolution signals", () => {
    expect(html).toMatch(/<html lang="en">/)
    expect(html).toContain('<link rel="canonical"')
    expect(html).toContain('property="og:image"')
    expect(html).toContain('property="og:type"')
  })

  it("points og:image at an absolute URL", () => {
    expect(html).toContain(`content="${SITE_URL}/og.png"`)
  })

  it("advertises the markdown and OpenAPI alternates", () => {
    expect(html).toContain('href="/llms.txt"')
    expect(html).toContain('href="/agents.md"')
    expect(html).toContain('rel="service-desc"')
  })
})
