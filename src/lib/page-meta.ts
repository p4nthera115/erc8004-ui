/**
 * Per-route document metadata.
 *
 * The site is a prerendered SPA: every route is snapshotted from one
 * `index.html`, so without this every page would ship the same <title>, the
 * same description and no canonical URL. Agents use exactly those signals for
 * entity resolution and attribution, and a search engine asked for this
 * project by name has nothing to match against if every page is titled the
 * same thing.
 *
 * Titles, descriptions and the set of valid paths come from the generated
 * route manifest, so a new page gets correct metadata by existing.
 *
 * `applyPageMeta` runs in a layout effect before the prerenderer's
 * `app-rendered` event, which is what bakes these tags into the static HTML.
 */

import { ROUTE_BY_PATH } from "@/generated/route-manifest"
import { SITE_URL } from "@/content/recovery-links"
import { normalizePath } from "@/server/negotiation"
import { applyStructuredData } from "@/lib/structured-data"

export type PageMeta = {
  title: string
  description: string
  /** Absolute canonical URL, or null for pages that should not be indexed. */
  canonical: string | null
  /** Absolute URL of the markdown twin, if the page has one. */
  markdown: string | null
  indexable: boolean
}

const NOT_FOUND_META: PageMeta = {
  title: "404 — Page not found — @erc8004/ui",
  description:
    "That page does not exist. The documentation index is at /llms.txt and the sitemap at /sitemap.xml.",
  canonical: null,
  markdown: null,
  indexable: false,
}

export function resolvePageMeta(pathname: string): PageMeta {
  const route = ROUTE_BY_PATH[normalizePath(pathname)]
  if (!route) return NOT_FOUND_META

  return {
    title: route.title,
    description: route.description,
    canonical: `${SITE_URL}${route.path === "/" ? "/" : route.path}`,
    markdown: route.markdown
      ? `${SITE_URL}${route.path === "/" ? "/llms.txt" : `${route.path}.md`}`
      : null,
    indexable: true,
  }
}

// ---------------------------------------------------------------------------
// DOM application
// ---------------------------------------------------------------------------

function setMeta(selector: string, create: () => HTMLElement, value: string) {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  if (element instanceof HTMLMetaElement) element.content = value
  else if (element instanceof HTMLLinkElement) element.href = value
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove()
}

function namedMeta(name: string, value: string) {
  setMeta(
    `meta[name="${name}"]`,
    () => {
      const element = document.createElement("meta")
      element.setAttribute("name", name)
      return element
    },
    value
  )
}

function propertyMeta(property: string, value: string) {
  setMeta(
    `meta[property="${property}"]`,
    () => {
      const element = document.createElement("meta")
      element.setAttribute("property", property)
      return element
    },
    value
  )
}

function canonicalLink(href: string) {
  setMeta(
    'link[rel="canonical"]',
    () => {
      const element = document.createElement("link")
      element.setAttribute("rel", "canonical")
      return element
    },
    href
  )
}

/**
 * This page's own markdown twin. Marked with `data-page-markdown` so it is
 * distinguishable from the site-wide alternates in index.html (/llms.txt,
 * /llms-full.txt, /agents.md) — selecting on rel+type alone would overwrite
 * the first of those instead of adding to them.
 */
function pageMarkdownLink(href: string) {
  setMeta(
    "link[data-page-markdown]",
    () => {
      const element = document.createElement("link")
      element.setAttribute("rel", "alternate")
      element.setAttribute("type", "text/markdown")
      element.setAttribute("data-page-markdown", "")
      element.setAttribute("title", "This page as Markdown")
      return element
    },
    href
  )
}

export function applyPageMeta(pathname: string): void {
  if (typeof document === "undefined") return
  const meta = resolvePageMeta(pathname)

  document.title = meta.title
  namedMeta("description", meta.description)
  propertyMeta("og:title", meta.title)
  propertyMeta("og:description", meta.description)
  namedMeta("twitter:title", meta.title)
  namedMeta("twitter:description", meta.description)

  if (meta.canonical) {
    canonicalLink(meta.canonical)
    propertyMeta("og:url", meta.canonical)
  } else {
    // A 404 has no canonical URL, and pointing og:url at the homepage would
    // attribute the error page to it.
    removeMeta('link[rel="canonical"]')
    removeMeta('meta[property="og:url"]')
  }

  if (meta.indexable) {
    removeMeta('meta[name="robots"]')
  } else {
    namedMeta("robots", "noindex, follow")
  }

  // Point agents at this page's markdown twin rather than only at the site
  // index, so a fetch of the HTML carries its own machine-readable alternate.
  if (meta.markdown) {
    pageMarkdownLink(meta.markdown)
  } else {
    removeMeta("link[data-page-markdown]")
  }

  // The same identity claims as the <meta> tags above, in the form a search
  // engine or an agent can parse without inferring anything from prose.
  applyStructuredData(pathname)
}
