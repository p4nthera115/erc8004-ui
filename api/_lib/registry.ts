/**
 * Lookups over the documentation snapshot, shared by the REST endpoints and
 * the HTTP MCP endpoint so both resolve names the same way.
 */

import { REGISTRY } from "../_generated/registry"
import type { ComponentSnapshot, GuideSnapshot } from "./registry-types"

export { REGISTRY }

/** First sentence of a description — the scannable one-liner. */
export function firstSentence(text: string): string {
  return text.split(/(?<=\.)\s/)[0]
}

/**
 * Resolves a component by slug or name, tolerating the shapes an agent
 * actually sends: "ReputationScore", "reputation-score", "reputation score",
 * "<ReputationScore />".
 */
export function findComponent(nameOrSlug: string): ComponentSnapshot | undefined {
  const query = nameOrSlug.trim().toLowerCase()
  if (!query) return undefined

  const direct = REGISTRY.components.find(
    (component) =>
      component.slug === query || component.name.toLowerCase() === query
  )
  if (direct) return direct

  const loose = query.replace(/[^a-z0-9]/g, "")
  if (!loose) return undefined
  return REGISTRY.components.find(
    (component) =>
      component.slug.replace(/-/g, "") === loose ||
      component.name.toLowerCase() === loose
  )
}

export function findGuide(slug: string): GuideSnapshot | undefined {
  const query = slug.trim().toLowerCase()
  return REGISTRY.guides.find((guide) => guide.slug === query)
}

export function findGroup(title: string): { title: string; slugs: string[] } | undefined {
  const query = title.trim().toLowerCase()
  return REGISTRY.groups.find((group) => group.title.toLowerCase() === query)
}

export const componentSlugs = (): string[] =>
  REGISTRY.components.map((component) => component.slug)

export const guideSlugs = (): string[] =>
  REGISTRY.guides.map((guide) => guide.slug)

export const groupTitles = (): string[] =>
  REGISTRY.groups.map((group) => group.title)

/** The list-shaped projection of a component — no markdown, no examples. */
export function componentSummary(component: ComponentSnapshot) {
  return {
    slug: component.slug,
    name: component.name,
    group: component.group,
    description: firstSentence(component.description),
    importLine: component.importLine,
    requiredProps: component.props
      .filter((prop) => prop.required)
      .map((prop) => prop.name),
    docsUrl: component.docsUrl,
    markdownUrl: `${component.docsUrl}.md`,
    apiUrl: `${REGISTRY.siteUrl}/api/components/${component.slug}`,
  }
}

/**
 * Free-text search across the fields an agent would actually search on. Scored
 * so that a name match outranks a description match, which outranks a props
 * or example match.
 */
export function searchComponents(query: string): ComponentSnapshot[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return REGISTRY.components

  const scored = REGISTRY.components
    .map((component) => {
      let score = 0
      if (component.name.toLowerCase().includes(needle)) score += 100
      if (component.slug.includes(needle)) score += 80
      if (component.group.toLowerCase().includes(needle)) score += 40
      if (component.description.toLowerCase().includes(needle)) score += 20
      if (component.props.some((prop) => prop.name.toLowerCase().includes(needle)))
        score += 10
      if (component.markdown.toLowerCase().includes(needle)) score += 1
      return { component, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map((entry) => entry.component)
}
