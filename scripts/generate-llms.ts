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
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ---------------------------------------------------------------------------
// Config — edit these when things change
// ---------------------------------------------------------------------------

const SITE_URL = "https://erc8004-ui.vercel.app"
const GITHUB_URL = "https://github.com/p4nthera115/erc8004-ui"

// Package naming.
//
// The library is not yet published to npm, and the final package name has not
// been chosen. PACKAGE_NAME is used:
//   1. As the import path in every code example in the generated docs
//   2. As the title of llms.txt and llms-full.txt
//   3. In the install instructions (when IS_PUBLISHED is true)
//
// When IS_PUBLISHED is false, the install snippet is replaced with a
// "install from GitHub" instruction and a provisional-name banner is
// emitted at the top of llms.txt and llms-full.txt.
//
// When you choose the real name and publish: update PACKAGE_NAME, set
// IS_PUBLISHED = true, and re-run the build. Every output regenerates.
const PACKAGE_NAME = "@erc8004/ui"
const IS_PUBLISHED = false

const TAGLINE =
  "Drop-in React components for displaying verified ERC-8004 AI agent identity, reputation, and validation data. Self-contained, trustless, and designed to be consumed by AI coding agents."

const PROVISIONAL_NAME_NOTICE =
  `**NOTE — provisional package name.** This library is not yet published to npm. ` +
  `\`${PACKAGE_NAME}\` is a placeholder used in code examples — the final package name has not been chosen and will likely differ. ` +
  `Until publication, install directly from GitHub: ${GITHUB_URL}. ` +
  `Once published, this notice will disappear and all code examples will reflect the real package name.`

// ---------------------------------------------------------------------------
// Resolve paths relative to this file
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const PUBLIC_DIR = join(REPO_ROOT, "public")
const LLMS_DIR = join(PUBLIC_DIR, "llms")
const GUIDES_DIR = join(LLMS_DIR, "_guides")

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
  const rows = props.map((p) => {
    const req = p.required ? "yes" : "no"
    const def = p.default ? `\`${p.default}\`` : "—"
    // Escape pipes inside descriptions so the table doesn't break
    const desc = p.description.replace(/\|/g, "\\|")
    return `| \`${p.name}\` | \`${p.type}\` | ${req} | ${def} | ${desc} |`
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

function componentMarkdown(doc: ComponentDoc): string {
  const sections: string[] = [
    `# ${doc.name}`,
    "",
    `**Slug:** \`${doc.slug}\`  `,
    `**Import:** \`${doc.importLine}\``,
    "",
  ]
  if (!IS_PUBLISHED) {
    sections.push(`> ${PROVISIONAL_NAME_NOTICE}`)
    sections.push("")
  }
  sections.push(`## Description`, "", doc.description, "")
  const notesSection = notesMarkdown(doc.notes)
  if (notesSection) {
    sections.push(`## Caveats`, "", notesSection)
  }
  sections.push(
    `## Props`,
    "",
    propsTable(doc.props),
    `## Usage`,
    "",
    "```tsx",
    doc.usage,
    "```",
    "",
    `## Reference`,
    "",
    `- Live preview & full docs: ${SITE_URL}/docs/components/${doc.slug}`,
    `- Markdown source: ${SITE_URL}/llms/${doc.slug}.md`,
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

  if (!IS_PUBLISHED) {
    sections.push(`> ${PROVISIONAL_NAME_NOTICE}`)
    sections.push("")
  }

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
          `- [${doc.name}](${SITE_URL}/llms/${doc.slug}.md): ${oneLine}`
        )
      }
      sections.push("")
    }
  }

  sections.push("")
  sections.push("## Reference")
  sections.push("")
  sections.push(`- Live page: ${SITE_URL}/docs/${slug}`)
  sections.push(`- Markdown source: ${SITE_URL}/llms/_guides/${slug}.md`)
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
  if (!IS_PUBLISHED) {
    lines.push(PROVISIONAL_NAME_NOTICE)
    lines.push("")
  }
  lines.push("## Setup")
  lines.push("")
  for (const g of GUIDES) {
    lines.push(
      `- [${g.name}](${SITE_URL}/llms/_guides/${g.slug}.md): ${g.description}`
    )
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
      lines.push(`- [${doc.name}](${SITE_URL}/llms/${doc.slug}.md): ${oneLine}`)
    }
    lines.push("")
  }
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
  if (!IS_PUBLISHED) {
    lines.push(PROVISIONAL_NAME_NOTICE)
    lines.push("")
  }
  lines.push(
    `This file contains the complete guides and component reference for ${PACKAGE_NAME}, generated from the canonical registries. For an indexed version with per-page links, see ${SITE_URL}/llms.txt.`
  )
  lines.push("")
  lines.push("---")
  lines.push("")
  lines.push("## Quick Start")
  lines.push("")
  if (IS_PUBLISHED) {
    lines.push("```bash")
    lines.push(
      `npm install ${PACKAGE_NAME} react react-dom @tanstack/react-query`
    )
    lines.push("```")
  } else {
    lines.push(
      `The package is not yet on npm. Install peer dependencies normally and add the library directly from GitHub:`
    )
    lines.push("")
    lines.push("```bash")
    lines.push(`npm install react react-dom @tanstack/react-query`)
    lines.push(
      `npm install ${GITHUB_URL.replace("https://", "github:").replace(
        "github.com/",
        ""
      )}`
    )
    lines.push("```")
    lines.push("")
    lines.push(
      `The import path \`${PACKAGE_NAME}\` shown below is provisional and will change once the package is published under its real name.`
    )
  }
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
  lines.push("        agentId={2290}")
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

  // 1. The index
  const indexFile = join(PUBLIC_DIR, "llms.txt")
  writeFileSync(indexFile, buildLlmsTxt(), "utf8")
  console.log(`[generate-llms] wrote ${indexFile}`)

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

  console.log("[generate-llms] Done.")
}

main()
