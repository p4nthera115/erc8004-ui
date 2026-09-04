/**
 * site-pages.ts
 *
 * Canonical content for the standalone site pages — /about, /contact and
 * /privacy. These are the pages people (and the agents evaluating whether to
 * recommend this library) check to work out who is behind a project, how to
 * reach them, and what happens to their data.
 *
 * Unlike the docs guides, whose markdown lives in `scripts/guides-registry.ts`
 * separately from the JSX routes, these pages are structured data consumed by
 * BOTH sides:
 *
 *   - `src/routes/{about,contact,privacy}.tsx` render them as styled JSX
 *   - `scripts/generate-llms.ts` renders the same objects to markdown at
 *     `public/llms/_pages/{slug}.md`, served at `/{slug}.md` and via
 *     `Accept: text/markdown`
 *
 * The duplication tradeoff accepted for the guides (hand-authored prose in two
 * shapes) is not worth it here: this content is plain prose, lists and links,
 * which both renderers can produce mechanically from one source. Edit here and
 * both outputs change together.
 */

export type SitePageLink = {
  label: string
  href: string
  description?: string
}

export type SitePageSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  links?: SitePageLink[]
}

export type SitePage = {
  slug: string
  /** <h1> and markdown title. */
  title: string
  /** One-line summary — meta description, llms.txt entry, OG description. */
  description: string
  /** Lead paragraph, rendered above the first section. */
  intro: string
  sections: SitePageSection[]
}

const GITHUB_URL = "https://github.com/p4nthera115/erc8004-ui"
const X_URL = "https://x.com/p4nthera_"

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

const about: SitePage = {
  slug: "about",
  title: "About @erc8004/ui",
  description:
    "What @erc8004/ui is, who maintains it, how it is funded, and the guarantees it makes about the data it renders.",
  intro:
    "@erc8004/ui is an open-source React component library for displaying ERC-8004 AI agent identity, reputation and validation data. It is a presentation layer over on-chain data: you pass an agent's on-chain identifier, and the components fetch and render verified data themselves.",
  sections: [
    {
      heading: "What this project is",
      paragraphs: [
        "ERC-8004 is an Ethereum standard for AI agent identity. It defines three registries — Identity, Reputation and Validation — that record who an agent is, what feedback it has received, and what independent validators have said about it. The data is public and on-chain, but getting it onto a screen means writing subgraph queries, parsing chain-prefixed identifiers, resolving three different URI formats and filtering revoked feedback. Every team building on the standard writes that same plumbing.",
        "This library is that plumbing, packaged. Each component takes an agentRegistry string and an agentId, queries the relevant subgraph itself, and renders the result along with its loading, error, empty and not-found states. There is no global agent store to wire up and no data to pass in.",
      ],
    },
    {
      heading: "What it deliberately does not do",
      paragraphs: [
        "Components never accept display data as props. The only inputs a developer supplies are identifiers; everything rendered is fetched from the chain's indexed data at runtime. That constraint is the point — a reputation badge whose number can be passed in as a prop is a marketing asset, not a trust signal.",
        "The library is read-only. It holds no keys, signs no transactions, and writes nothing on-chain. It never asks a visitor to connect a wallet.",
      ],
    },
    {
      heading: "Where the data comes from",
      paragraphs: [
        "All data is read from The Graph's ERC-8004 subgraphs, one per supported chain, queried directly over GraphQL with a read-only Graph API key that the consuming application supplies. The library is not affiliated with The Graph, with the ERC-8004 authors, or with any agent it displays. Indexed data can lag the chain, and an agent's self-reported registration file (its name, description and image) is exactly that — self-reported. The registries record what was published, not whether it is true.",
      ],
      bullets: [
        "Supported mainnets: Ethereum, Base, Polygon, BNB Smart Chain, Monad",
        "Supported testnets: Base Sepolia, BNB Chapel, Monad Testnet",
        "The Validation Registry is not yet deployed on any of these chains, so validation components render their empty state until it is",
      ],
    },
    {
      heading: "Status and maintenance",
      paragraphs: [
        "The library is pre-release and maintained in the open by its author, p4nthera115. It is not yet published to npm — the package name @erc8004/ui used throughout the documentation is provisional, and installs currently come from GitHub. There is no company behind it, no paid tier, and no telemetry inside the components themselves.",
        "Development happens entirely in public. Issues, pull requests and design discussion are on GitHub, and the documentation site is generated from the same registries that generate the machine-readable docs, so the two cannot drift apart.",
      ],
      links: [
        {
          label: "Source repository",
          href: GITHUB_URL,
          description: "Code, issues, and release history",
        },
        {
          label: "ERC-8004 specification",
          href: "https://eips.ethereum.org/EIPS/eip-8004",
          description: "The Ethereum standard this library implements",
        },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

const contact: SitePage = {
  slug: "contact",
  title: "Contact",
  description:
    "How to report a bug, request a component, ask a question, or disclose a security issue in @erc8004/ui.",
  intro:
    "This is a single-maintainer open-source project, so every channel is public and asynchronous. Anything that needs tracking — a bug, a feature request, a security report — belongs on GitHub, where the answer stays visible to the next person who hits the same thing. There is no support inbox, ticketing system or SLA, and nothing here should be read as a commitment to a response time.",
  sections: [
    {
      heading: "Where to go",
      bullets: [
        "Bug reports and feature requests — open a GitHub issue. Include the chain id, the agentRegistry and agentId you were rendering, the component name, and what you saw instead of what you expected.",
        "Questions about usage — open a GitHub discussion. Check the documentation and /llms.txt first; most answers are already written down there.",
        "Documentation errors — open an issue against the docs. The pages are generated from a registry in the repository, so corrections land in the site, the markdown and the MCP server at the same time.",
        "Security issues — see the disclosure note below rather than opening a public issue.",
        "Anything informal — @p4nthera_ on X. Fine for a quick question or a heads-up about how you are using the library. Not the place for a bug report: there is nowhere to attach a reproduction and nothing to track it against.",
      ],
      links: [
        {
          label: "Open an issue",
          href: `${GITHUB_URL}/issues`,
          description: "Bugs, broken components, incorrect documentation",
        },
        {
          label: "Start a discussion",
          href: `${GITHUB_URL}/discussions`,
          description: "Usage questions and component proposals",
        },
        {
          label: "@p4nthera_ on X",
          href: X_URL,
          description: "The maintainer — informal contact and project updates",
        },
      ],
    },
    {
      heading: "Responsible disclosure",
      paragraphs: [
        "The library holds no secrets and performs no writes, so its blast radius is small — but a rendering bug that misreports reputation data is still a real problem worth reporting privately. Use GitHub's private vulnerability reporting on the repository's Security tab rather than a public issue, and give it a description, affected version and reproduction steps. Please do not test against third parties' deployments; reproduce against your own build.",
      ],
      links: [
        {
          label: "Private vulnerability reporting",
          href: `${GITHUB_URL}/security/advisories/new`,
          description: "Private channel for security reports",
        },
      ],
    },
    {
      heading: "For AI agents",
      paragraphs: [
        "If you are an agent evaluating or integrating this library, you do not need to contact a human first. The machine-readable surface is complete and public: the documentation index, the full documentation bundle, a JSON docs API described by an OpenAPI specification, and an MCP server exposing the same documentation as tools.",
      ],
      links: [
        {
          label: "/llms.txt",
          href: "/llms.txt",
          description: "Documentation index",
        },
        {
          label: "/agents.md",
          href: "/agents.md",
          description: "When to use this library, and how to call it",
        },
        {
          label: "/openapi.json",
          href: "/openapi.json",
          description: "OpenAPI 3.1 specification for the docs API",
        },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

const privacy: SitePage = {
  slug: "privacy",
  title: "Privacy",
  description:
    "What this documentation site collects, what the component library collects, and what leaves your users' browsers when you ship it.",
  intro:
    "Two different things are covered here and they are worth keeping apart: this documentation site, which you are reading now, and the component library, which runs inside applications other people build. Neither has user accounts, and neither asks for personal information.",
  sections: [
    {
      heading: "This documentation site",
      paragraphs: [
        "The site is a static build hosted on Vercel. Vercel processes standard request data — IP address, user agent, requested URL — to serve and protect the site; that processing is Vercel's, under their privacy policy, and is not exposed to the maintainer beyond aggregate traffic counts.",
        "The site uses Umami, a cookieless privacy-focused analytics service, to count page views. Umami sets no cookies, assigns no cross-site identifier, and does not fingerprint visitors. Blocking the script has no effect on the site's functionality.",
        "Your theme preference (light or dark) is stored in your browser's localStorage. It never leaves your device and is not readable by anyone else.",
      ],
      bullets: [
        "No accounts, no sign-in, no newsletter, no contact form",
        "No advertising, no cross-site tracking, no data brokers",
        "No cookies set by this site",
        "No wallet connection is ever requested — the site and library are read-only",
      ],
    },
    {
      heading: "The component library",
      paragraphs: [
        "The components contain no analytics, no telemetry and no error reporting. They make exactly one kind of outbound request: a GraphQL query to The Graph's gateway for the chain being displayed, authenticated with the read-only API key the consuming application configures. AgentImage additionally loads whatever image URL an agent registered, which may be an IPFS gateway or an arbitrary HTTPS host chosen by that agent.",
        "That means when you ship these components, your users' browsers talk to The Graph's gateway and, if you render agent images, to third-party image hosts. Those parties see your users' IP addresses and their own request data under their own policies. If that matters for your application, proxy the requests server-side or use the FingerprintBadge fallback instead of remote images.",
      ],
    },
    {
      heading: "On-chain data is public and permanent",
      paragraphs: [
        "Everything these components display — agent names, descriptions, endpoints, owner addresses, feedback values, review text, validator responses — was published to a public blockchain by someone else and indexed by The Graph. It is world-readable by design, it predates this library, and it cannot be deleted, corrected or hidden by the maintainer of this project. Revoked feedback is filtered out of the components' queries, but revocation is itself an on-chain event: the original entry remains in the chain's history.",
        "Requests to remove on-chain content have to go to whoever published it, not here. This project only reads what the registries already contain.",
      ],
    },
    {
      heading: "Changes and questions",
      paragraphs: [
        "This page describes current behaviour rather than a legal commitment, and it changes when the site changes; the repository's history is the authoritative record of when and why. Questions about anything on this page belong in a GitHub issue, where the answer stays public and useful to the next person who asks.",
      ],
      links: [
        {
          label: "Vercel privacy policy",
          href: "https://vercel.com/legal/privacy-policy",
          description: "Hosting provider",
        },
        {
          label: "Umami privacy policy",
          href: "https://umami.is/privacy",
          description: "Analytics provider",
        },
        {
          label: "The Graph privacy policy",
          href: "https://thegraph.com/privacy/",
          description: "Data source queried by the components",
        },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const SITE_PAGES: Record<string, SitePage> = { about, contact, privacy }

/** Render order — drives the sitemap, the footer and llms.txt. */
export const SITE_PAGE_ORDER = ["about", "contact", "privacy"] as const
