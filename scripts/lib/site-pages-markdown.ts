/**
 * Renders the /about, /contact and /privacy pages to markdown.
 *
 * Same objects the JSX routes render, same section order, so the markdown a
 * caller gets from `Accept: text/markdown` (or `/about.md`) says exactly what
 * the HTML page says.
 */

import type { SitePage } from "../../src/content/site-pages"

export function sitePageMarkdown(page: SitePage, siteUrl: string): string {
  const lines: string[] = [`# ${page.title}`, "", page.intro, ""]

  for (const section of page.sections) {
    lines.push(`## ${section.heading}`, "")

    for (const paragraph of section.paragraphs ?? []) {
      lines.push(paragraph, "")
    }

    for (const bullet of section.bullets ?? []) {
      lines.push(`- ${bullet}`)
    }
    if (section.bullets?.length) lines.push("")

    for (const link of section.links ?? []) {
      const href = link.href.startsWith("/") ? `${siteUrl}${link.href}` : link.href
      lines.push(
        `- [${link.label}](${href})${link.description ? `: ${link.description}` : ""}`
      )
    }
    if (section.links?.length) lines.push("")
  }

  lines.push("## Reference", "")
  lines.push(`- Live page: ${siteUrl}/${page.slug}`)
  lines.push(`- Markdown source: ${siteUrl}/${page.slug}.md`)
  lines.push(`- Documentation index: ${siteUrl}/llms.txt`)
  lines.push("")

  return lines.join("\n")
}
