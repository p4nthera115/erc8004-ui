/**
 * The tools exposed over the HTTP MCP endpoint.
 *
 * These are the four *documentation* tools from the stdio server
 * (`packages/mcp-server`), reimplemented against the same snapshot. The two
 * live tools — check_chain_support and check_agent — are intentionally absent
 * here: they query The Graph with a Graph API key, and a public unauthenticated
 * endpoint would be spending the site owner's quota on anonymous callers.
 * Agents that need live checks install the stdio server with their own key.
 */

import {
  REGISTRY,
  componentSlugs,
  findComponent,
  findGroup,
  firstSentence,
  groupTitles,
  guideSlugs,
  findGuide,
  searchComponents,
} from "./registry"

export type ToolContent = { type: "text"; text: string }
export type ToolResult = { content: ToolContent[]; isError?: boolean }

export type JsonSchema = {
  type: "object"
  properties: Record<string, unknown>
  required?: string[]
  additionalProperties: false
}

export type ToolDefinition = {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  run: (args: Record<string, unknown>) => ToolResult
}

const text = (body: string): ToolResult => ({
  content: [{ type: "text", text: body }],
})

const failure = (body: string): ToolResult => ({
  content: [{ type: "text", text: body }],
  isError: true,
})

function componentIndex(): string {
  const lines: string[] = []
  for (const group of REGISTRY.groups) {
    lines.push(`### ${group.title}`)
    for (const slug of group.slugs) {
      const component = REGISTRY.components.find((entry) => entry.slug === slug)
      if (!component) continue
      lines.push(
        `- ${component.name} (\`${component.slug}\`) — ${firstSentence(component.description)}`
      )
    }
    lines.push("")
  }
  return lines.join("\n")
}

function stringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  return typeof value === "string" && value.trim() !== "" ? value : undefined
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "list_components",
    title: "List components",
    description:
      `Lists every component in the ${REGISTRY.packageName} library, grouped by ` +
      "registry (Providers, Identity, Reputation, Validation, Activity). Start " +
      "here to discover what exists, then call get_component for full docs on one.",
    inputSchema: {
      type: "object",
      properties: {
        group: {
          type: "string",
          enum: groupTitles(),
          description: "Optional group filter.",
        },
        q: {
          type: "string",
          description:
            "Optional free-text filter across component names, props and documentation.",
        },
      },
      additionalProperties: false,
    },
    run: (args) => {
      const group = stringArg(args, "group")
      const query = stringArg(args, "q")

      if (group) {
        const matched = findGroup(group)
        if (!matched) {
          return failure(
            `Unknown group "${group}". Available groups: ${groupTitles().join(", ")}.`
          )
        }
        const lines = matched.slugs
          .map((slug) => REGISTRY.components.find((entry) => entry.slug === slug))
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
          .map(
            (entry) =>
              `- ${entry.name} (\`${entry.slug}\`) — ${firstSentence(entry.description)}`
          )
        return text(`### ${matched.title}\n\n${lines.join("\n")}`)
      }

      if (query) {
        const matches = searchComponents(query)
        if (matches.length === 0) {
          return text(
            `No component matches "${query}".\n\nEverything available:\n\n${componentIndex()}`
          )
        }
        return text(
          `# Components matching "${query}" (${matches.length})\n\n` +
            matches
              .map(
                (entry) =>
                  `- ${entry.name} (\`${entry.slug}\`, ${entry.group}) — ${firstSentence(entry.description)}`
              )
              .join("\n")
        )
      }

      return text(
        `# ${REGISTRY.packageName} — ${REGISTRY.components.length} components\n\n` +
          `${REGISTRY.tagline}\n\n${componentIndex()}` +
          (REGISTRY.provisionalNameNotice
            ? `\n> ${REGISTRY.provisionalNameNotice}\n`
            : "")
      )
    },
  },
  {
    name: "get_component",
    title: "Get component documentation",
    description:
      "Returns complete documentation for one component: description, caveats, " +
      "import line, usage, worked examples, an in-context composition example, " +
      "the full props table, and how it handles loading/error/empty states. " +
      "Accepts a component name (ReputationScore) or slug (reputation-score).",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Component name or slug, e.g. 'ReputationScore'.",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
    run: (args) => {
      const name = stringArg(args, "name")
      if (!name) {
        return failure(
          "get_component requires a `name` — a component name or slug. " +
            `Available: ${componentSlugs().join(", ")}.`
        )
      }
      const component = findComponent(name)
      if (!component) {
        return failure(
          `No component named "${name}".\n\nAvailable components:\n\n${componentIndex()}`
        )
      }
      return text(component.markdown)
    },
  },
  {
    name: "get_setup_guide",
    title: "Get setup guide",
    description:
      "Returns a full setup or concept guide. Use 'installation' for first-time " +
      "setup (install, provider, API key), 'concepts' for the data model and " +
      "chain support, 'api-keys' for Graph API key handling, and 'theming' for " +
      "styling and dark mode. Defaults to 'installation'.",
    inputSchema: {
      type: "object",
      properties: {
        guide: {
          type: "string",
          enum: guideSlugs(),
          description: "Guide slug. Defaults to 'installation'.",
        },
      },
      additionalProperties: false,
    },
    run: (args) => {
      const slug = stringArg(args, "guide") ?? "installation"
      const guide = findGuide(slug)
      if (!guide) {
        return failure(
          `Unknown guide "${slug}". Available: ${guideSlugs().join(", ")}.`
        )
      }
      return text(guide.markdown)
    },
  },
  {
    name: "get_types",
    title: "Get TypeScript types",
    description:
      "Returns the library's exported TypeScript type definitions — the shape " +
      "of the on-chain data these components render (AgentData, AgentFeedbackStats, " +
      "AgentValidationStats, Feedback, Validation, and related types).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run: () =>
      text(
        `// ${REGISTRY.packageName} — public type definitions (src/types.ts)\n\n${REGISTRY.types}`
      ),
  },
]

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name)
}

/** Tool list in the shape MCP's `tools/list` expects. */
export function toolDescriptors() {
  return TOOLS.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }))
}
