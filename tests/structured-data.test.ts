/**
 * JSON-LD structured data.
 *
 * Two things can go wrong and neither shows up in the browser: the graph can
 * be invalid (a crawler drops it silently), and the static copy baked into
 * index.html can drift from the one the app generates at runtime — in which
 * case the homepage claims one thing before hydration and another after.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { buildStructuredData } from "../src/lib/structured-data"
import { ROUTE_MANIFEST } from "../src/generated/route-manifest"

const REPO_ROOT = join(__dirname, "..")
const SITE_URL = "https://erc8004-ui.vercel.app"

type Node = Record<string, unknown> & { "@type": string | string[]; "@id"?: string }

const graphOf = (pathname: string) =>
  buildStructuredData(pathname)["@graph"] as Node[]

const nodeOf = (pathname: string, type: string) =>
  graphOf(pathname).find((node) =>
    Array.isArray(node["@type"]) ? node["@type"].includes(type) : node["@type"] === type
  )

describe("index.html", () => {
  const html = readFileSync(join(REPO_ROOT, "index.html"), "utf8")
  const script =
    /<script type="application\/ld\+json" id="structured-data">([\s\S]*?)<\/script>/.exec(
      html
    )

  it("carries a JSON-LD block, so the homepage has it without JavaScript", () => {
    expect(script, "no ld+json script in index.html").toBeTruthy()
  })

  it("parses, and is exactly the graph buildStructuredData produces for /", () => {
    // The runtime version replaces this on navigation and the prerenderer
    // bakes the result into every page. If the two disagree, the homepage says
    // different things before and after hydration — and this is the only place
    // that notices.
    expect(JSON.parse(script![1])).toEqual(buildStructuredData("/"))
  })
})

describe("buildStructuredData", () => {
  it("is a schema.org graph", () => {
    const data = buildStructuredData("/")
    expect(data["@context"]).toBe("https://schema.org")
    expect(Array.isArray(data["@graph"])).toBe(true)
  })

  it("identifies the product with the fields the audit asks for", () => {
    const software = nodeOf("/", "SoftwareApplication")!
    expect(software.name).toBe("@erc8004/ui")
    expect(software.url).toBe(`${SITE_URL}/`)
    expect(String(software.description).length).toBeGreaterThan(40)
    expect(software.applicationCategory).toBe("DeveloperApplication")
    expect(software.offers).toBeTruthy()
  })

  it("claims the library and its source as one entity", () => {
    // A library is both a thing you install and a thing you read the source
    // of; consumers key off one type or the other.
    const software = nodeOf("/", "SoftwareApplication")!
    expect(software["@type"]).toEqual(["SoftwareApplication", "SoftwareSourceCode"])
    expect(software.codeRepository).toBe("https://github.com/p4nthera115/erc8004-ui")
  })

  it("links the off-site profiles a name search has to reconcile", () => {
    // This is the brand-discoverability half: `sameAs` is what ties the
    // domain to the GitHub repo and the maintainer's account, so a search for
    // the name resolves to one entity rather than several strings.
    const person = nodeOf("/", "Person")!
    expect(person.sameAs).toContain("https://github.com/p4nthera115")
    expect(person.sameAs).toContain("https://x.com/p4nthera_")

    const software = nodeOf("/", "SoftwareApplication")!
    expect(software.sameAs).toContain("https://github.com/p4nthera115/erc8004-ui")
  })

  it("gives the site its alternate spellings, so a query can match either", () => {
    const website = nodeOf("/", "WebSite")!
    expect(website.alternateName).toEqual(["erc8004-ui", "ERC-8004 UI"])
  })

  it("resolves every internal @id reference", () => {
    for (const route of ROUTE_MANIFEST) {
      const graph = graphOf(route.path)
      const ids = new Set(graph.map((node) => node["@id"]).filter(Boolean))

      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (!node || typeof node !== "object") return
        const entries = Object.entries(node as Record<string, unknown>)
        // A bare `{ "@id": ... }` is a reference; a node with other keys is a
        // definition and defines its own id.
        if (entries.length === 1 && entries[0][0] === "@id") {
          expect(ids, `${route.path} → ${entries[0][1]}`).toContain(entries[0][1])
          return
        }
        entries.forEach(([, value]) => walk(value))
      }
      graph.forEach(walk)
    }
  })

  it("describes each page as itself, at its own canonical URL", () => {
    for (const route of ROUTE_MANIFEST) {
      const page = nodeOf(route.path, "WebPage")!
      expect(page, route.path).toBeTruthy()
      expect(page.url, route.path).toBe(
        `${SITE_URL}${route.path === "/" ? "/" : route.path}`
      )
      expect(page.name, route.path).toBe(route.title)
      expect(page.description, route.path).toBe(route.description)
    }
  })

  it("declares the markdown twin as an alternate encoding of the page", () => {
    const page = nodeOf("/docs/installation", "WebPage")!
    expect(page.encoding).toEqual({
      "@type": "MediaObject",
      encodingFormat: "text/markdown",
      contentUrl: `${SITE_URL}/docs/installation.md`,
    })
  })

  it("builds a breadcrumb trail for nested pages and none for the homepage", () => {
    expect(nodeOf("/", "BreadcrumbList")).toBeUndefined()

    const crumbs = nodeOf("/docs/components/agent-card", "BreadcrumbList")!
    const items = crumbs.itemListElement as Array<{ position: number; name: string }>
    expect(items.map((item) => item.position)).toEqual([1, 2, 3, 4])
    expect(items[0].name).toBe("Home")
    expect(items[1].name).toBe("Documentation")
    expect(items.at(-1)!.name).toBe("AgentCard")
  })

  it("ignores a trailing slash, exactly as the router does", () => {
    expect(buildStructuredData("/docs/installation/")).toEqual(
      buildStructuredData("/docs/installation")
    )
  })

  it("claims the project but not the page for a path off the manifest", () => {
    // The 404 page renders through the same code path, and `applyPageMeta`
    // marks it noindex. A WebPage node there would hand a crawler an entity
    // for a URL that does not exist — the project-level nodes still apply.
    expect(nodeOf("/no-such-page", "SoftwareApplication")).toBeTruthy()
    expect(nodeOf("/no-such-page", "WebPage")).toBeUndefined()
    expect(nodeOf("/no-such-page", "BreadcrumbList")).toBeUndefined()
  })
})
