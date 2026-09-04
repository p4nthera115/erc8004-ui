/**
 * Shape of the build-time documentation snapshot.
 *
 * `scripts/generate-llms.ts` writes `api/_generated/registry.ts` against this
 * type from the same registries that produce the docs site, llms.txt and the
 * stdio MCP server's snapshot — so the JSON API, the markdown files and the
 * rendered pages cannot describe different libraries.
 */

export type PropDef = {
  name: string
  type: string
  required: boolean
  default?: string
  description: string
}

export type NoteDef = {
  variant: "info" | "warning"
  title?: string
  body: string
}

export type ExampleSnapshot = {
  name: string
  description: string
  code: string
}

export type ComponentSnapshot = {
  slug: string
  name: string
  group: string
  description: string
  notes: NoteDef[]
  importLine: string
  usage: string
  examples: ExampleSnapshot[]
  inContext: { description: string; code: string } | null
  states: string | null
  props: PropDef[]
  docsUrl: string
  /** Fully rendered markdown — byte-identical to the `.md` the site serves. */
  markdown: string
}

export type GuideSnapshot = {
  slug: string
  name: string
  description: string
  docsUrl: string
  markdown: string
}

export type ChainSnapshot = {
  chainId: number
  name: string
  testnet: boolean
  subgraphId: string
}

export type GroupSnapshot = { title: string; slugs: string[] }

export type RegistrySnapshot = {
  generatedAt: string
  packageName: string
  isPublished: boolean
  provisionalNameNotice: string | null
  tagline: string
  siteUrl: string
  githubUrl: string
  subgraphBaseUrl: string
  chains: ChainSnapshot[]
  groups: GroupSnapshot[]
  components: ComponentSnapshot[]
  guides: GuideSnapshot[]
  types: string
}
