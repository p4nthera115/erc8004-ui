/**
 * generate-llms.ts
 *
 * Reads the canonical component registry and the docs route files, then writes
 * AI-readable documentation into `public/` so it ships at the root of the
 * deployed site.
 *
 * Outputs:
 *   public/llms.txt                       — short index (the "menu")
 *   public/llms-full.txt                  — everything inlined (the "all-you-can-eat")
 *   public/llms/{slug}.md                 — one file per component
 *   public/llms/_guides/{name}.md         — one file per guide page (intro, install, etc.)
 *
 * Run automatically as a `prebuild` hook — see package.json.
 *
 * Why this is structured the way it is:
 *   - registry.tsx is the SINGLE SOURCE OF TRUTH for components. Adding a new
 *     component to registry.tsx automatically propagates everywhere — site,
 *     llms.txt, llms-full.txt, per-component markdown, and (later) the MCP
 *     server. No manual sync required.
 *   - Per-component markdown lets an AI fetch only what it needs. Cheap because
 *     we generate them; expensive only if maintained by hand.
 *   - llms-full.txt exists as the "single fetch, everything in context" escape
 *     hatch for AIs that prefer one big read over many small ones.
 */

import {
  COMPONENT_REGISTRY,
  type ComponentDoc,
  type PropDef,
} from "../src/components/docs/registry"
import { GUIDE_REGISTRY, GUIDE_ORDER } from "./guides-registry"
import { SUBGRAPH_IDS } from "../packages/ui/src/lib/constants"
import { SITE_PAGES, SITE_PAGE_ORDER } from "../src/content/site-pages"
import { buildAgentsMd } from "./lib/agents-md"
import { buildOpenApiDocument } from "./lib/openapi"
import {
  renderRouteManifest,
  renderSitemap,
  type ManifestRoute,
} from "./lib/route-manifest"
import { sitePageMarkdown } from "./lib/site-pages-markdown"
import { toYaml } from "./lib/yaml"
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ---------------------------------------------------------------------------
// Config — edit these when things change
// ---------------------------------------------------------------------------

const SITE_URL = "https://erc8004-ui.vercel.app"
const GITHUB_URL = "https://github.com/p4nthera115/erc8004-ui"

// Package naming.
//
// PACKAGE_NAME is used:
//   1. As the import path in every code example in the generated docs
//   2. As the title of llms.txt and llms-full.txt
//   3. In the install instructions
//
// The scope is deliberately personal rather than @erc8004. This is an
// independent library; a package sitting on the protocol's own name would
// read as an official release from the ERC-8004 authors, which it is not.
// NON_AFFILIATION_NOTICE says so in plain words — AI agents ingest these
// files, and the name alone is a weaker signal than a sentence.
const PACKAGE_NAME = "@p4n/erc8004-ui"

// Version of the published API contract, not of the build. Bump it when an
// endpoint's response shape changes in a way a caller could notice; leaving the
// build timestamp here would churn /openapi.json on every deploy for no signal.
const OPENAPI_VERSION = "1.1.0"

const TAGLINE =
  "Drop-in React components for displaying verified ERC-8004 AI agent identity, reputation, and validation data. Self-contained, trustless, and designed to be consumed by AI coding agents."

const NON_AFFILIATION_NOTICE =
  `**NOTE — unofficial library.** \`${PACKAGE_NAME}\` is an independent, ` +
  `community-built project. It is not affiliated with, maintained by, or ` +
  `endorsed by the authors of ERC-8004. It reads the standard's on-chain data ` +
  `through public subgraphs; it does not speak for the standard.`

// ---------------------------------------------------------------------------
// Resolve paths relative to this file
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const PUBLIC_DIR = join(REPO_ROOT, "public")
const LLMS_DIR = join(PUBLIC_DIR, "llms")
const GUIDES_DIR = join(LLMS_DIR, "_guides")
// Markdown twins of the standalone /about, /contact and /privacy pages. Kept
// beside the guides so one `headers` rule in vercel.json covers every .md file.
const PAGES_DIR = join(LLMS_DIR, "_pages")
const GENERATED_SRC_DIR = join(REPO_ROOT, "src", "generated")
// The MCP server consumes a JSON snapshot of the same registries rather than
// importing registry.tsx directly — that would pull React and every component
// into a server-side bundle. Emitting it here keeps the snapshot regenerating
// on exactly the same cadence as llms.txt, so the two can never drift.
const MCP_GENERATED_DIR = join(
  REPO_ROOT,
  "packages",
  "mcp-server",
  "src",
  "generated"
)
// The same snapshot, as a TypeScript module, for the Vercel functions under
// /api. A `.ts` module rather than a JSON import so the platform's bundler
// traces it like any other source file.
const API_GENERATED_DIR = join(REPO_ROOT, "api", "_generated")

// ---------------------------------------------------------------------------
// Component grouping — mirrors the categories shown on /docs/components
// ---------------------------------------------------------------------------

const GROUPS: Array<{ title: string; slugs: string[] }> = [
  {
    title: "Providers",
    slugs: ["erc8004-provider", "agent-provider"],
  },
  {
    title: "Identity",
    slugs: [
      "agent-name",
      "agent-image",
      "agent-description",
      "agent-card",
      "endpoint-status",
    ],
  },
  {
    title: "Reputation",
    slugs: [
      "reputation-score",
      "reputation-timeline",
      "reputation-distribution",
      "feedback-list",
      "tag-cloud",
    ],
  },
  {
    title: "Validation",
    slugs: [
      "verification-badge",
      "validation-score",
      "validation-list",
      "validation-display",
    ],
  },
  {
    title: "Activity",
    slugs: ["last-activity", "activity-log"],
  },
]

// ---------------------------------------------------------------------------
// Chain metadata — display names for the chain IDs in packages/ui/src/lib/constants.ts.
// The IDs themselves stay in constants.ts (the library's own source of truth);
// only the human-readable labels live here, since they're documentation.
// ---------------------------------------------------------------------------

const CHAIN_META: Record<number, { name: string; testnet: boolean }> = {
  1: { name: "Ethereum", testnet: false },
  8453: { name: "Base", testnet: false },
  137: { name: "Polygon", testnet: false },
  56: { name: "BNB Smart Chain", testnet: false },
  143: { name: "Monad", testnet: false },
  84532: { name: "Base Sepolia", testnet: true },
  97: { name: "BNB Chapel", testnet: true },
  10143: { name: "Monad Testnet", testnet: true },
}

// ---------------------------------------------------------------------------
// Guide pages — content lives in `scripts/guides-registry.ts`, the canonical
// source. Each guide's body is hand-authored markdown converted from the
// corresponding `src/routes/docs/{slug}.tsx` route file. The script imports
// the registry the same way it imports COMPONENT_REGISTRY for components.
// ---------------------------------------------------------------------------

const GUIDES = GUIDE_ORDER.map((slug) => {
  const g = GUIDE_REGISTRY[slug]
  if (!g) {
    throw new Error(`[generate-llms] Missing guide in registry: ${slug}`)
  }
  return {
    name: g.name,
    slug: g.slug,
    description: g.description,
    url: `${SITE_URL}/docs/${slug}`,
  }
})

// ---------------------------------------------------------------------------
// Markdown formatting helpers
// ---------------------------------------------------------------------------

function propsTable(props: PropDef[]): string {
  if (props.length === 0) return "_No props._\n"
  const header =
    "| Prop | Type | Required | Default | Description |\n| --- | --- | --- | --- | --- |"
  // Every cell must escape pipes, not just the description. Union types like
  // `"linear" | "monotone"` are common here, and an unescaped pipe silently
  // splits the row into extra columns — the rendered table then shows the type
  // truncated at the first pipe with the rest smeared across the wrong headings.
  const cell = (value: string) => value.replace(/\|/g, "\\|")

  const rows = props.map((p) => {
    const req = p.required ? "yes" : "no"
    const def = p.default ? `\`${cell(p.default)}\`` : "—"
    return `| \`${cell(p.name)}\` | \`${cell(
      p.type
    )}\` | ${req} | ${def} | ${cell(p.description)} |`
  })
  return [header, ...rows].join("\n") + "\n"
}

// Rewrite internal `/docs/...` links inside markdown bodies to absolute SITE_URL
// links so AI consumers can resolve them without a base URL.
function absolutizeDocsLinks(body: string): string {
  return body.replace(
    /\]\((\/docs\/[^)]+)\)/g,
    (_match, path) => `](${SITE_URL}${path})`
  )
}

function notesMarkdown(notes: ComponentDoc["notes"]): string {
  if (!notes || notes.length === 0) return ""
  const lines: string[] = []
  for (const note of notes) {
    const label =
      note.title ?? (note.variant === "warning" ? "Warning" : "Note")
    lines.push(`> **${label}:** ${absolutizeDocsLinks(note.body)}`)
    lines.push("")
  }
  return lines.join("\n")
}

/**
 * Component markdown — mirrors the section structure rendered by
 * `src/components/docs/DocPageLayout.tsx` so the markdown agents fetch via
 * Accept: text/markdown stays at content parity with the HTML version. The
 * sections, in order:
 *   Description → Caveats → Preview (code) → Usage → Examples → In Context →
 *   API Reference (props table) → States → Reference
 * Optional sections are skipped when the registry entry doesn't define them,
 * matching the conditional rendering in DocPageLayout.
 */
function componentMarkdown(doc: ComponentDoc): string {
  const sections: string[] = [
    `# ${doc.name}`,
    "",
    `**Slug:** \`${doc.slug}\`  `,
    `**Import:** \`${doc.importLine}\``,
    "",
  ]

  sections.push(`> ${NON_AFFILIATION_NOTICE}`)
  sections.push("")

  sections.push(`## Description`, "", doc.description, "")

  const notesSection = notesMarkdown(doc.notes)
  if (notesSection) {
    sections.push(`## Caveats`, "", notesSection)
  }

  if (doc.previewCode) {
    sections.push(
      `## Preview`,
      "",
      "```tsx",
      `${doc.importLine}\n${doc.previewCode}`,
      "```",
      ""
    )
  }

  sections.push(
    `## Usage`,
    "",
    "```tsx",
    `${doc.importLine}\n${doc.usage}`,
    "```",
    ""
  )

  if (doc.examples && doc.examples.length > 0) {
    sections.push(`## Examples`, "")
    for (const example of doc.examples) {
      sections.push(`### ${example.name}`, "")
      if (example.description) {
        sections.push(example.description, "")
      }
      sections.push("```tsx", example.code, "```", "")
    }
  }

  if (doc.inContext) {
    sections.push(`## In Context`, "")
    if (doc.inContext.description) {
      sections.push(doc.inContext.description, "")
    }
    sections.push("```tsx", doc.inContext.code, "```", "")
  }

  sections.push(`## API Reference`, "", propsTable(doc.props))

  if (doc.states) {
    sections.push(`## States`, "", doc.states, "")
  }

  sections.push(
    `## Reference`,
    "",
    `- Live preview & full docs: ${SITE_URL}/docs/components/${doc.slug}`,
    `- Markdown source: ${SITE_URL}/docs/components/${doc.slug}.md`,
    ""
  )

  return sections.join("\n")
}

function applyGuidePlaceholders(body: string): string {
  return body
    .replace(/\{\{SITE_URL\}\}/g, SITE_URL)
    .replace(/\{\{PACKAGE_NAME\}\}/g, PACKAGE_NAME)
}

function guideMarkdown(slug: string): string {
  const guide = GUIDE_REGISTRY[slug]
  if (!guide) {
    throw new Error(`[generate-llms] Unknown guide slug: ${slug}`)
  }

  const sections: string[] = []
  sections.push(`# ${guide.name}`)
  sections.push("")

  sections.push(`> ${NON_AFFILIATION_NOTICE}`)
  sections.push("")

  // Top-of-page caveats — mirrors componentMarkdown's "Caveats" section.
  const notesSection = notesMarkdown(guide.notes)
  if (notesSection) {
    sections.push("## Caveats")
    sections.push("")
    sections.push(notesSection)
  }

  // Body — substitute placeholders, then absolutize internal /docs/... links.
  sections.push(absolutizeDocsLinks(applyGuidePlaceholders(guide.body)))

  // The components guide is intentionally a stub in the registry — append the
  // grouped component list from GROUPS so it stays in sync with llms.txt.
  if (slug === "components") {
    sections.push("")
    for (const group of GROUPS) {
      sections.push(`### ${group.title}`)
      sections.push("")
      for (const cslug of group.slugs) {
        const doc = COMPONENT_REGISTRY[cslug]
        if (!doc) continue
        const oneLine = doc.description.split(/(?<=\.)\s/)[0]
        sections.push(
          `- [${doc.name}](${SITE_URL}/docs/components/${doc.slug}.md): ${oneLine}`
        )
      }
      sections.push("")
    }
  }

  sections.push("")
  sections.push("## Reference")
  sections.push("")
  sections.push(`- Live page: ${SITE_URL}/docs/${slug}`)
  sections.push(`- Markdown source: ${SITE_URL}/docs/${slug}.md`)
  sections.push("")

  return sections.join("\n")
}

// ---------------------------------------------------------------------------
// File 1: llms.txt — the index
// ---------------------------------------------------------------------------

function buildLlmsTxt(): string {
  const lines: string[] = []
  lines.push(`# ${PACKAGE_NAME}`)
  lines.push("")
  lines.push(`> ${TAGLINE}`)
  lines.push("")
  lines.push(NON_AFFILIATION_NOTICE)
  lines.push("")

  // When-to-use guidance, before the first H2. llms.txt allows free markdown
  // here but not headings, so this stays as prose and a bullet list; the full
  // version lives in /agents.md, linked below and in Developer resources.
  lines.push(
    "**When to use this:** reach for these components when a task involves showing " +
      "ERC-8004 agent data in a React UI — an agent profile or directory page, a " +
      "reputation or verification badge beside an agent's name, a feedback or " +
      "validation list, or any surface where the number on screen has to come from " +
      "the chain rather than from the surrounding app. Each component takes only an " +
      "`agentRegistry` and an `agentId` and fetches its own verified data, so there " +
      "is no subgraph plumbing to write and no way for the host app to fake a score."
  )
  lines.push("")
  lines.push(
    "**When not to use it:** it is React-only, read-only and ERC-8004-only. It " +
      "cannot register agents, leave feedback or submit validations (use the Agent0 " +
      "SDK for writes), and it cannot render agents described by your own API — no " +
      "component accepts display data as a prop."
  )
  lines.push("")
  lines.push(
    `Full agent instructions, including how to call the MCP endpoint and the JSON ` +
      `API: ${SITE_URL}/agents.md`
  )
  lines.push("")
  lines.push("## Setup")
  lines.push("")
  for (const g of GUIDES) {
    // Link to the canonical /docs/{slug}.md path so llms.txt entries match the
    // sitemap (after stripping .md). The vercel.json rewrite proxies these to
    // the underlying /llms/_guides/{slug}.md file.
    lines.push(`- [${g.name}](${SITE_URL}/docs/${g.slug}.md): ${g.description}`)
  }
  lines.push("")
  lines.push("## Components")
  lines.push("")
  for (const group of GROUPS) {
    lines.push(`### ${group.title}`)
    lines.push("")
    for (const slug of group.slugs) {
      const doc = COMPONENT_REGISTRY[slug]
      if (!doc) {
        console.warn(`[generate-llms] Missing component in registry: ${slug}`)
        continue
      }
      // First sentence of description only — the menu should be scannable
      const oneLine = doc.description.split(/(?<=\.)\s/)[0]
      lines.push(
        `- [${doc.name}](${SITE_URL}/docs/components/${doc.slug}.md): ${oneLine}`
      )
    }
    lines.push("")
  }
  lines.push("## Developer resources")
  lines.push("")
  lines.push(
    `- [Agent instructions](${SITE_URL}/agents.md): When to use this library, when not to, how to call it, and the subgraph rules that are easy to get wrong.`
  )
  lines.push(
    `- [OpenAPI specification](${SITE_URL}/openapi.json): OpenAPI 3.1 document for the read-only JSON documentation API. YAML at ${SITE_URL}/openapi.yaml.`
  )
  lines.push(
    `- [JSON documentation API](${SITE_URL}/api): Endpoint index. Components, props, guides and chain support as JSON, with structured JSON errors.`
  )
  lines.push(
    `- [MCP endpoint](${SITE_URL}/api/mcp): Hosted Model Context Protocol server, Streamable HTTP transport, no key required.`
  )
  lines.push(
    `- [MCP manifest](${SITE_URL}/.well-known/mcp): Transport, supported protocol versions and tool list for the MCP endpoint.`
  )
  lines.push(
    `- [MCP server guide](${SITE_URL}/docs/mcp.md): Installing the stdio server, which adds live subgraph and agent checks.`
  )
  lines.push("")
  lines.push("## About this project")
  lines.push("")
  for (const slug of SITE_PAGE_ORDER) {
    const page = SITE_PAGES[slug]
    lines.push(
      `- [${page.title}](${SITE_URL}/${page.slug}.md): ${page.description}`
    )
  }
  lines.push("")
  lines.push("## Optional")
  lines.push("")
  lines.push(
    `- [Full bundle](${SITE_URL}/llms-full.txt): All components and guides concatenated into a single file for one-shot context loading.`
  )
  lines.push(
    `- [GitHub repository](${GITHUB_URL}): Source code, issues, and discussions.`
  )
  lines.push(
    `- [ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004): The Ethereum standard this library implements.`
  )
  lines.push("")
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// File 2: llms-full.txt — everything inlined
// ---------------------------------------------------------------------------

function buildLlmsFull(): string {
  const lines: string[] = []
  lines.push(`# ${PACKAGE_NAME} — Full Documentation Bundle`)
  lines.push("")
  lines.push(`> ${TAGLINE}`)
  lines.push("")
  lines.push(NON_AFFILIATION_NOTICE)
  lines.push("")
  lines.push(
    `This file contains the complete guides and component reference for ${PACKAGE_NAME}, generated from the canonical registries. For an indexed version with per-page links, see ${SITE_URL}/llms.txt.`
  )
  lines.push("")
  lines.push("---")
  lines.push("")
  lines.push("## Quick Start")
  lines.push("")
  lines.push("```bash")
  lines.push(
    `npm install ${PACKAGE_NAME} react react-dom @tanstack/react-query`
  )
  lines.push("```")
  lines.push("")
  lines.push("```tsx")
  lines.push(
    `import { ERC8004Provider, ReputationScore } from "${PACKAGE_NAME}"`
  )
  lines.push("")
  lines.push("function App() {")
  lines.push("  return (")
  lines.push('    <ERC8004Provider apiKey="your-graph-api-key">')
  lines.push("      <ReputationScore")
  lines.push(
    '        agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"'
  )
  lines.push("        agentId={888}")
  lines.push("      />")
  lines.push("    </ERC8004Provider>")
  lines.push("  )")
  lines.push("}")
  lines.push("```")
  lines.push("")
  lines.push(
    "Get a free Graph API key at https://thegraph.com/studio. It is a read-only query key, safe to use in frontend code."
  )
  lines.push("")
  lines.push("---")
  lines.push("")
  lines.push("## Guides")
  lines.push("")
  for (const slug of GUIDE_ORDER) {
    lines.push(guideMarkdown(slug))
    lines.push("---")
    lines.push("")
  }
  lines.push("## Components")
  lines.push("")
  for (const group of GROUPS) {
    lines.push(`## ${group.title}`)
    lines.push("")
    for (const slug of group.slugs) {
      const doc = COMPONENT_REGISTRY[slug]
      if (!doc) continue
      lines.push(componentMarkdown(doc))
      lines.push("---")
      lines.push("")
    }
  }
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// File 5: the MCP registry snapshot
//
// A plain-JSON projection of COMPONENT_REGISTRY + GUIDE_REGISTRY that the MCP
// server reads at build time. Two things are deliberately true of it:
//
//   1. The React `preview` fields are stripped. They're live JSX elements —
//      not serialisable, and meaningless outside a browser.
//   2. Each entry carries its fully-rendered `markdown` alongside the
//      structured fields. `get_component` can then return byte-identical
//      content to what the docs site and llms.txt serve, while tools like
//      `list_components` still get typed fields to filter on.
// ---------------------------------------------------------------------------

type SnapshotProp = Omit<PropDef, never>

function snapshotComponent(doc: ComponentDoc, group: string) {
  return {
    slug: doc.slug,
    name: doc.name,
    group,
    description: doc.description,
    notes: doc.notes ?? [],
    importLine: doc.importLine,
    usage: doc.usage,
    examples: (doc.examples ?? []).map((e) => ({
      name: e.name,
      description: e.description,
      code: e.code,
    })),
    inContext: doc.inContext
      ? { description: doc.inContext.description, code: doc.inContext.code }
      : null,
    states: doc.states ?? null,
    props: doc.props as SnapshotProp[],
    docsUrl: `${SITE_URL}/docs/components/${doc.slug}`,
    markdown: componentMarkdown(doc),
  }
}

function buildRegistrySnapshot() {
  const groupOf = new Map<string, string>()
  for (const g of GROUPS) {
    for (const slug of g.slugs) groupOf.set(slug, g.title)
  }

  const components = []
  for (const group of GROUPS) {
    for (const slug of group.slugs) {
      const doc = COMPONENT_REGISTRY[slug]
      if (!doc) continue
      components.push(snapshotComponent(doc, group.title))
    }
  }

  // Anything in the registry that isn't in a GROUP still ships, ungrouped —
  // the generator already warns about these when building llms.txt.
  for (const doc of Object.values(COMPONENT_REGISTRY)) {
    if (groupOf.has(doc.slug)) continue
    console.warn(`[generate-llms] Ungrouped component in snapshot: ${doc.slug}`)
    components.push(snapshotComponent(doc, "Other"))
  }

  const guides = GUIDE_ORDER.map((slug) => {
    const g = GUIDE_REGISTRY[slug]!
    return {
      slug: g.slug,
      name: g.name,
      description: g.description,
      docsUrl: `${SITE_URL}/docs/${g.slug}`,
      markdown: guideMarkdown(slug),
    }
  })

  const chains = Object.entries(SUBGRAPH_IDS)
    .map(([id, subgraphId]) => {
      const chainId = Number(id)
      const meta = CHAIN_META[chainId]
      return {
        chainId,
        name: meta?.name ?? `Chain ${chainId}`,
        testnet: meta?.testnet ?? false,
        subgraphId,
      }
    })
    .sort(
      (a, b) => Number(a.testnet) - Number(b.testnet) || a.chainId - b.chainId
    )

  return {
    generatedAt: new Date().toISOString(),
    packageName: PACKAGE_NAME,
    nonAffiliationNotice: NON_AFFILIATION_NOTICE,
    tagline: TAGLINE,
    siteUrl: SITE_URL,
    githubUrl: GITHUB_URL,
    subgraphBaseUrl: "https://gateway.thegraph.com/api",
    chains,
    groups: GROUPS,
    components,
    guides,
    // packages/ui/src/types.ts verbatim — the public data-model surface.
    // Inlined so the MCP server needs no filesystem access to the repo at
    // runtime.
    types: readFileSync(
      join(REPO_ROOT, "packages", "ui", "src", "types.ts"),
      "utf8"
    ),
  }
}

// ---------------------------------------------------------------------------
// The route manifest — every URL the site serves
//
// Emitted to src/generated/route-manifest.ts and consumed by the edge
// middleware (content negotiation and markdown 404s), by the page <head>
// manager (title, description, canonical) and by the sitemap below.
// ---------------------------------------------------------------------------

/** Guides that are entry points get a higher sitemap priority than the rest. */
const PRIMARY_GUIDES = new Set(["introduction", "components"])

/**
 * Every <title> names the product, so a search for it by name has something to
 * match — but a page whose own name already contains it is left alone rather
 * than reading "About @p4n/erc8004-ui — @p4n/erc8004-ui".
 */
function titled(name: string): string {
  return name.includes(PACKAGE_NAME) ? name : `${name} — ${PACKAGE_NAME}`
}

function buildRouteManifest(): ManifestRoute[] {
  const routes: ManifestRoute[] = [
    {
      path: "/",
      title: `${PACKAGE_NAME} — React components for ERC-8004 agent data`,
      description: TAGLINE,
      // The index is the closest markdown equivalent of the landing page: it
      // is what an agent asking the site "what are you" should be handed.
      // Points at the .md twin rather than /llms.txt so the negotiated
      // response is text/markdown — see the note where both are written.
      markdown: "/llms/index.md",
      kind: "home",
      priority: 1,
    },
    {
      // Redirects to /docs/introduction for browsers; markdown callers get the
      // index. Priority 0 keeps it out of the sitemap — it is not canonical.
      path: "/docs",
      title: titled("Documentation"),
      description: "Documentation index.",
      markdown: "/llms/index.md",
      kind: "index",
      priority: 0,
    },
  ]

  for (const slug of GUIDE_ORDER) {
    const guide = GUIDE_REGISTRY[slug]
    if (!guide) continue
    routes.push({
      path: `/docs/${slug}`,
      title: titled(guide.name),
      description: guide.description,
      markdown: `/llms/_guides/${slug}.md`,
      kind: "guide",
      priority: PRIMARY_GUIDES.has(slug) ? 0.8 : 0.64,
    })
  }

  for (const group of GROUPS) {
    for (const slug of group.slugs) {
      const doc = COMPONENT_REGISTRY[slug]
      if (!doc) continue
      routes.push({
        path: `/docs/components/${slug}`,
        title: titled(doc.name),
        description: doc.description.split(/(?<=\.)\s/)[0],
        markdown: `/llms/${slug}.md`,
        kind: "component",
        priority: 0.64,
      })
    }
  }

  for (const slug of SITE_PAGE_ORDER) {
    const page = SITE_PAGES[slug]
    routes.push({
      path: `/${page.slug}`,
      title: titled(page.title),
      description: page.description,
      markdown: `/llms/_pages/${page.slug}.md`,
      kind: "page",
      priority: 0.5,
    })
  }

  return routes
}

// ---------------------------------------------------------------------------
// Write everything out
// ---------------------------------------------------------------------------

function ensureCleanDir(dir: string) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

function main() {
  console.log("[generate-llms] Starting…")

  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })
  ensureCleanDir(LLMS_DIR)
  mkdirSync(GUIDES_DIR, { recursive: true })

  // 1. The index, twice.
  //
  // /llms.txt is the name the convention specifies and the one everything
  // links to. /llms/index.md is the same bytes under a .md extension, and it
  // exists because of how Vercel serves a middleware rewrite: `headers` rules
  // in vercel.json are matched against the URL the *caller* asked for, not the
  // rewrite target, so the Content-Type override that makes /llms.txt
  // text/markdown does not apply when `/` is negotiated into it — and a .txt
  // file falls back to text/plain, which is not acceptmarkdown.com compliant.
  // A .md target gets text/markdown from the static file server itself.
  const llmsTxt = buildLlmsTxt()
  const indexFile = join(PUBLIC_DIR, "llms.txt")
  writeFileSync(indexFile, llmsTxt, "utf8")
  console.log(`[generate-llms] wrote ${indexFile}`)

  const indexMarkdownFile = join(LLMS_DIR, "index.md")
  writeFileSync(indexMarkdownFile, llmsTxt, "utf8")
  console.log(`[generate-llms] wrote ${indexMarkdownFile}`)

  // 2. The full bundle
  const fullFile = join(PUBLIC_DIR, "llms-full.txt")
  writeFileSync(fullFile, buildLlmsFull(), "utf8")
  console.log(`[generate-llms] wrote ${fullFile}`)

  // 3. Per-component markdown
  let count = 0
  for (const doc of Object.values(COMPONENT_REGISTRY)) {
    const file = join(LLMS_DIR, `${doc.slug}.md`)
    writeFileSync(file, componentMarkdown(doc), "utf8")
    count++
  }
  console.log(
    `[generate-llms] wrote ${count} per-component markdown files into ${LLMS_DIR}`
  )

  // 4. Per-guide markdown
  for (const slug of GUIDE_ORDER) {
    const file = join(GUIDES_DIR, `${slug}.md`)
    writeFileSync(file, guideMarkdown(slug), "utf8")
  }
  console.log(
    `[generate-llms] wrote ${GUIDE_ORDER.length} guide markdown files into ${GUIDES_DIR}`
  )

  // 5. Standalone page markdown — /about.md, /contact.md, /privacy.md
  mkdirSync(PAGES_DIR, { recursive: true })
  for (const slug of SITE_PAGE_ORDER) {
    const page = SITE_PAGES[slug]
    writeFileSync(
      join(PAGES_DIR, `${page.slug}.md`),
      sitePageMarkdown(page, SITE_URL),
      "utf8"
    )
  }
  console.log(
    `[generate-llms] wrote ${SITE_PAGE_ORDER.length} page markdown files into ${PAGES_DIR}`
  )

  // 6. MCP registry snapshot (stdio server) and its TypeScript twin (/api)
  //
  // The /api twin is committed rather than gitignored. Vercel builds the
  // functions under /api from the source tree, and does not guarantee that it
  // does so after the framework build command has run — so a snapshot that
  // only exists once `prebuild` has run can be missing when the function is
  // traced, and every /api route then dies at import with a module-not-found.
  // Committing it removes the ordering question entirely.
  const snapshot = buildRegistrySnapshot()

  mkdirSync(API_GENERATED_DIR, { recursive: true })
  const apiSnapshotFile = join(API_GENERATED_DIR, "registry.ts")
  const renderApiSnapshot = (value: typeof snapshot) =>
    "// AUTO-GENERATED by scripts/generate-llms.ts — do not edit by hand.\n" +
    "// Regenerate with `pnpm gen:registry`.\n" +
    "//\n" +
    "// Committed rather than gitignored: the Vercel functions under /api import\n" +
    "// it, and they are not guaranteed to be built after the build command that\n" +
    "// generates it.\n\n" +
    'import type { RegistrySnapshot } from "../_lib/registry-types.js"\n\n' +
    `export const REGISTRY: RegistrySnapshot = ${JSON.stringify(
      value,
      null,
      2
    )}\n`

  // Because it is committed, the build stamp has to be stable: a regeneration
  // that changes no documentation must leave no diff, or every `pnpm test`
  // dirties the tree. Keep the previous stamp when the rest is byte-identical.
  const previousApiSnapshot = existsSync(apiSnapshotFile)
    ? readFileSync(apiSnapshotFile, "utf8")
    : null
  const previousStamp = previousApiSnapshot?.match(
    /"generatedAt": "([^"]+)"/
  )?.[1]
  if (
    previousStamp &&
    renderApiSnapshot({ ...snapshot, generatedAt: previousStamp }) ===
      previousApiSnapshot
  ) {
    snapshot.generatedAt = previousStamp
  }

  writeFileSync(apiSnapshotFile, renderApiSnapshot(snapshot), "utf8")
  console.log(`[generate-llms] wrote ${apiSnapshotFile}`)

  mkdirSync(MCP_GENERATED_DIR, { recursive: true })
  const snapshotFile = join(MCP_GENERATED_DIR, "registry.json")
  writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), "utf8")
  console.log(
    `[generate-llms] wrote ${snapshotFile} (${snapshot.components.length} components, ${snapshot.guides.length} guides, ${snapshot.chains.length} chains)`
  )

  // 7. Route manifest — the list every URL-aware consumer reads
  const routes = buildRouteManifest()
  mkdirSync(GENERATED_SRC_DIR, { recursive: true })
  const manifestFile = join(GENERATED_SRC_DIR, "route-manifest.ts")
  writeFileSync(manifestFile, renderRouteManifest(routes), "utf8")
  console.log(`[generate-llms] wrote ${manifestFile} (${routes.length} routes)`)

  // 8. Sitemap — canonical HTML pages plus the machine-readable entry points
  const lastmod = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00")
  const sitemapFile = join(PUBLIC_DIR, "sitemap.xml")
  writeFileSync(
    sitemapFile,
    renderSitemap(
      routes.filter((route) => route.priority > 0),
      SITE_URL,
      lastmod,
      [
        { loc: `${SITE_URL}/llms.txt`, priority: 0.8 },
        { loc: `${SITE_URL}/llms-full.txt`, priority: 0.8 },
        { loc: `${SITE_URL}/agents.md`, priority: 0.8 },
        { loc: `${SITE_URL}/openapi.json`, priority: 0.6 },
      ]
    ),
    "utf8"
  )
  console.log(`[generate-llms] wrote ${sitemapFile}`)

  // 9. robots.txt — points crawlers at the sitemap and the agent files
  writeFileSync(
    join(PUBLIC_DIR, "robots.txt"),
    [
      "# Every page here is public documentation. Crawl all of it.",
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      "",
      "# Machine-readable entry points, in rough order of usefulness:",
      `#   ${SITE_URL}/agents.md      when to use this library and how to call it`,
      `#   ${SITE_URL}/llms.txt       documentation index`,
      `#   ${SITE_URL}/llms-full.txt  full documentation in one fetch`,
      `#   ${SITE_URL}/openapi.json   OpenAPI 3.1 description of the JSON docs API`,
      `#   ${SITE_URL}/api/mcp        Model Context Protocol endpoint (Streamable HTTP)`,
      "",
    ].join("\n"),
    "utf8"
  )
  console.log(`[generate-llms] wrote ${join(PUBLIC_DIR, "robots.txt")}`)

  // 10. Agent instructions — /agents.md
  const agentsFile = join(PUBLIC_DIR, "agents.md")
  writeFileSync(
    agentsFile,
    buildAgentsMd({
      siteUrl: SITE_URL,
      githubUrl: GITHUB_URL,
      packageName: PACKAGE_NAME,
      tagline: TAGLINE,
      componentCount: snapshot.components.length,
      chains: snapshot.chains,
      guides: GUIDES.map((guide) => ({
        slug: guide.slug,
        name: guide.name,
        description: guide.description,
      })),
    }),
    "utf8"
  )
  console.log(`[generate-llms] wrote ${agentsFile}`)

  // 11. OpenAPI document, in both serialisations
  const openapi = buildOpenApiDocument({
    siteUrl: SITE_URL,
    packageName: PACKAGE_NAME,
    tagline: TAGLINE,
    githubUrl: GITHUB_URL,
    apiVersion: OPENAPI_VERSION,
    groupTitles: GROUPS.map((group) => group.title),
    componentSlugs: snapshot.components.map((component) => component.slug),
    guideSlugs: snapshot.guides.map((guide) => guide.slug),
  })
  writeFileSync(
    join(PUBLIC_DIR, "openapi.json"),
    JSON.stringify(openapi, null, 2) + "\n",
    "utf8"
  )
  writeFileSync(join(PUBLIC_DIR, "openapi.yaml"), toYaml(openapi), "utf8")
  console.log(
    `[generate-llms] wrote ${join(PUBLIC_DIR, "openapi.json")} and openapi.yaml`
  )

  console.log("[generate-llms] Done.")
}

main()
