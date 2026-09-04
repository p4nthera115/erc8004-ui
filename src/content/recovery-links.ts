/**
 * The "where to look next" list shown on a 404.
 *
 * One list, two renderings: `src/components/NotFoundPage.tsx` renders it as
 * HTML and `src/server/negotiation.ts` renders it as the markdown body served
 * to agents. A visitor and an agent that hit the same dead URL get the same
 * set of exits.
 */

export type RecoveryLink = {
  href: string
  label: string
  description: string
}

export const SITE_URL = "https://erc8004-ui.vercel.app"

export const RECOVERY_LINKS: RecoveryLink[] = [
  {
    href: "/llms.txt",
    label: "/llms.txt",
    description: "Documentation index — every page, one line each",
  },
  {
    href: "/llms-full.txt",
    label: "/llms-full.txt",
    description: "Full documentation bundle in a single fetch",
  },
  {
    href: "/agents.md",
    label: "/agents.md",
    description: "When to use this library, and how to call it",
  },
  {
    href: "/sitemap.xml",
    label: "/sitemap.xml",
    description: "Every canonical URL on this site",
  },
  {
    href: "/openapi.json",
    label: "/openapi.json",
    description: "OpenAPI 3.1 spec for the JSON docs API at /api",
  },
  {
    href: "/docs/introduction",
    label: "/docs/introduction",
    description: "Human documentation. Append .md for markdown",
  },
]
