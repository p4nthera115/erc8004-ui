import { useState } from "react"
import { FaCheck } from "react-icons/fa6"
import { IoCopy } from "react-icons/io5"
import { RULE, Section } from "./section"

const PROMPT = `Read https://erc8004-ui.vercel.app/llms.txt, then build me an agent profile page with @erc8004/ui.`

const RESOURCES = [
  {
    label: "/llms.txt",
    href: "/llms.txt",
    body: "Every page and component, one line each, with the description an agent needs to pick the right one.",
  },
  {
    label: "/llms-full.txt",
    href: "/llms-full.txt",
    body: "The entire documentation set — setup guides, props tables, examples — in a single fetch.",
  },
  {
    label: "*.md",
    href: "/docs/components/agent-card.md",
    body: "Append .md to any docs URL, or send Accept: text/markdown, and the page comes back as markdown.",
  },
]

const MCP_TOOLS = [
  "list_components",
  "get_component",
  "get_setup_guide",
  "get_types",
  "get_hooks",
]

export function ForAgents() {
  const [copied, setCopied] = useState(false)

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Section
      label="For AI coding agents"
      title="Written to be read by the thing that writes your frontend."
      intro="Most teams shipping ERC-8004 are backend teams, and the UI work gets handed to Claude Code or Cursor. So the docs are published in a form an agent can consume directly — no scraping, no guessing at props."
    >
      <div className="flex flex-col gap-8">
        <div className={`grid border-t border-l ${RULE} md:grid-cols-2`}>
          {RESOURCES.map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className={`flex flex-col gap-1.5 border-r border-b p-6 hover:bg-black/4 md:p-8 dark:hover:bg-white/6 ${RULE}`}
            >
              <span className="text-sm">{resource.label}</span>
              <span className="text-xs leading-relaxed text-text-secondary">
                {resource.body}
              </span>
            </a>
          ))}
          <div
            className={`flex flex-col gap-2 border-r border-b p-6 md:p-8 ${RULE}`}
          >
            <span className="text-sm">MCP server</span>
            <span className="text-xs leading-relaxed text-text-secondary">
              The component registry served over stdio, so your editor's agent
              can query it while it works.
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {MCP_TOOLS.map((tool) => (
                <span
                  key={tool}
                  className={`border px-2 py-1 text-[11px] text-text-secondary ${RULE}`}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex items-start gap-4 border p-5 ${RULE}`}>
          <p className="flex-1 text-md leading-relaxed text-primary">
            {PROMPT}
          </p>
          <button
            onClick={copyPrompt}
            aria-label="Copy prompt"
            className="shrink-0 cursor-pointer p-1.5 text-text-secondary hover:text-text-primary"
          >
            {copied ? <FaCheck size={14} /> : <IoCopy size={14} />}
          </button>
        </div>
      </div>
    </Section>
  )
}
