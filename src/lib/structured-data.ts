/**
 * JSON-LD structured data.
 *
 * Two audiences read this and neither of them reads the page: search engines
 * resolving "@p4n/erc8004-ui" to a thing rather than a string, and agents deciding
 * what this site is before spending tokens on it. Both want the same answer —
 * a piece of free, open-source developer software, who wrote it, where the
 * source is, and where the machine-readable documentation lives — and they
 * want it as data rather than inferred from prose.
 *
 * One graph per page, built from the route manifest so a page's node cannot
 * describe a URL the site does not serve. `index.html` carries the homepage's
 * graph statically, so it is present with JavaScript disabled and before
 * hydration; `applyPageMeta` swaps in the current route's graph on navigation,
 * and the prerenderer bakes that into each static file.
 *
 * `tests/structured-data.test.ts` asserts the static copy in index.html and
 * the output of `buildStructuredData("/")` are the same graph.
 */

import { ROUTE_BY_PATH } from "@/generated/route-manifest"
import { SITE_URL } from "@/content/recovery-links"
import { normalizePath } from "@/server/negotiation"

const PACKAGE_NAME = "@p4n/erc8004-ui"
const GITHUB_URL = "https://github.com/p4nthera115/erc8004-ui"
const X_URL = "https://x.com/p4nthera_"

const TAGLINE =
  "Drop-in React components for displaying verified ERC-8004 AI agent identity, reputation, and validation data. Self-contained, trustless, and designed to be consumed by AI coding agents."

const id = (fragment: string) => `${SITE_URL}/#${fragment}`

/** Titles in the manifest are suffixed with the package name; breadcrumbs are not. */
function shortTitle(title: string): string {
  return title.replace(new RegExp(`\\s*[—-]\\s*${PACKAGE_NAME}$`), "").trim()
}

function breadcrumb(path: string) {
  if (path === "/") return null

  const segments = path.split("/").filter(Boolean)
  const items = [{ name: "Home", item: `${SITE_URL}/` }]

  let cursor = ""
  for (const segment of segments) {
    cursor += `/${segment}`
    const route = ROUTE_BY_PATH[cursor]
    items.push({
      name: route
        ? shortTitle(route.title)
        : segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
      item: `${SITE_URL}${cursor}`,
    })
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${path}#breadcrumb`,
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

/**
 * The graph for one page. Nodes that describe the project itself are stable
 * across pages and referenced by `@id`, so a crawler that reads several pages
 * merges them into one entity rather than several near-duplicates.
 */
export function buildStructuredData(pathname: string): Record<string, unknown> {
  const path = normalizePath(pathname)
  const route = ROUTE_BY_PATH[path]
  const url = `${SITE_URL}${path === "/" ? "/" : path}`

  const person = {
    "@type": "Person",
    "@id": id("author"),
    name: "p4nthera115",
    alternateName: "@p4nthera_",
    url: "https://github.com/p4nthera115",
    sameAs: ["https://github.com/p4nthera115", X_URL],
  }

  const website = {
    "@type": "WebSite",
    "@id": id("website"),
    url: `${SITE_URL}/`,
    name: PACKAGE_NAME,
    alternateName: ["erc8004-ui", "ERC-8004 UI"],
    description: TAGLINE,
    inLanguage: "en",
    publisher: { "@id": id("author") },
  }

  const software = {
    // Both types: it is a library you install (SoftwareSourceCode) and a
    // finished thing you use (SoftwareApplication). Consumers key off one or
    // the other, and claiming only one hides it from half of them.
    "@type": ["SoftwareApplication", "SoftwareSourceCode"],
    "@id": id("software"),
    name: PACKAGE_NAME,
    alternateName: ["erc8004-ui", "ERC-8004 UI"],
    description: TAGLINE,
    url: `${SITE_URL}/`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    codeRepository: GITHUB_URL,
    programmingLanguage: ["TypeScript", "JavaScript"],
    runtimePlatform: "React 19",
    license: "https://spdx.org/licenses/MIT.html",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: { "@id": id("author") },
    maintainer: { "@id": id("author") },
    publisher: { "@id": id("author") },
    softwareHelp: {
      "@type": "WebPage",
      url: `${SITE_URL}/docs/introduction`,
    },
    sameAs: [GITHUB_URL],
    keywords: [
      "ERC-8004",
      "AI agents",
      "agent identity",
      "agent reputation",
      "React components",
      "The Graph",
      "blockchain",
      "trustless agents",
    ],
  }

  // A path that is not in the manifest is the 404 page, which `applyPageMeta`
  // marks noindex. Publishing a WebPage node for it would hand a crawler an
  // entity for a URL that does not exist; the project-level nodes still apply.
  if (!route) {
    return { "@context": "https://schema.org", "@graph": [website, person, software] }
  }

  const page: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: route.title,
    description: route.description,
    inLanguage: "en",
    isPartOf: { "@id": id("website") },
    about: { "@id": id("software") },
    primaryImageOfPage: `${SITE_URL}/og.png`,
  }

  // The markdown twin, declared as an alternate encoding of this same page —
  // the structured-data equivalent of the `Accept: text/markdown` negotiation.
  if (route.markdown) {
    page.encoding = {
      "@type": "MediaObject",
      encodingFormat: "text/markdown",
      contentUrl: `${SITE_URL}${path === "/" ? "/llms.txt" : `${path}.md`}`,
    }
  }

  const crumbs = breadcrumb(path)
  if (crumbs) page.breadcrumb = { "@id": crumbs["@id"] }

  return {
    "@context": "https://schema.org",
    "@graph": crumbs
      ? [website, person, software, page, crumbs]
      : [website, person, software, page],
  }
}

/** DOM id of the script tag holding the graph. */
export const STRUCTURED_DATA_ID = "structured-data"

export function applyStructuredData(pathname: string): void {
  if (typeof document === "undefined") return

  let script = document.getElementById(STRUCTURED_DATA_ID)
  if (!script) {
    script = document.createElement("script")
    script.id = STRUCTURED_DATA_ID
    script.setAttribute("type", "application/ld+json")
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(buildStructuredData(pathname), null, 2)
}
