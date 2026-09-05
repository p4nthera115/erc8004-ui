import type { ComponentDoc, NoteDef } from "./registry"
import { CodeBlock, InlineCode } from "./CodeBlock"
import { Callout } from "./Callout"
import { Link } from "@tanstack/react-router"

// Parse `[label](href)` link syntax in note bodies. Internal `/docs/...` hrefs
// (with or without a #hash) use TanStack Router's <Link>; everything else falls
// back to a plain anchor.
function renderNoteBody(body: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let key = 0
  for (const match of body.matchAll(linkRegex)) {
    const [full, label, href] = match
    const start = match.index ?? 0
    if (start > lastIndex) parts.push(body.slice(lastIndex, start))
    if (href.startsWith("/")) {
      const [path, hash] = href.split("#")
      parts.push(
        <Link
          key={key++}
          to={path}
          hash={hash}
          className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {label}
        </Link>
      )
    } else {
      parts.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {label}
        </a>
      )
    }
    lastIndex = start + full.length
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex))
  return parts
}

function NoteList({ notes }: { notes: NoteDef[] }) {
  return (
    <div className="flex flex-col gap-3">
      {notes.map((note, i) => (
        <Callout key={i} variant={note.variant} title={note.title}>
          {renderNoteBody(note.body)}
        </Callout>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-mono uppercase tracking-widest text-neutral-700 dark:text-white/80 mb-4 underline underline-offset-4">
      {children}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-mono text-neutral-600 dark:text-white/70 mb-3">
      {children}
    </h3>
  )
}

function PreviewBox({ children }: { children: React.ReactNode }) {
  // data-markdown-ignore: live React preview. Renders ephemeral on-chain data
  // (addresses, timestamps, scores) that has no counterpart in the markdown
  // twin — the authored CodeBlock example sits outside this wrapper. Excluding
  // it keeps AFDocs's content-parity comparison stable across every component
  // page; ActivityLog's preview in particular renders enough text to push the
  // page over the "substantive drift" threshold otherwise.
  return (
    <div
      data-toc-exclude
      data-markdown-ignore
      className="flex min-h-32 items-center justify-center overflow-x-auto rounded border border-black/60 bg-neutral-50 p-4 sm:p-8 dark:border-white/10 dark:bg-white/2"
    >
      {children}
    </div>
  )
}

/**
 * Below `sm` the five-column table is replaced by one stacked block per prop:
 * a 5-column scroll on a phone hides the description, which is the column that
 * matters most. Same data, same order, rendered twice — the table markup stays
 * intact for wide screens and for anything reading the DOM as a table.
 */
function PropCard({ prop }: { prop: ComponentDoc["props"][number] }) {
  return (
    <div className="flex flex-col gap-2 border-t border-black/60 py-4 dark:border-white/10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <InlineCode>{prop.name}</InlineCode>
        <span className="font-mono text-xs text-neutral-500 dark:text-white/50">
          {prop.required ? "required" : "optional"}
        </span>
      </div>
      <div className="flex flex-col gap-1 font-mono text-xs text-neutral-500 dark:text-white/50">
        <span className="[overflow-wrap:anywhere]">type: {prop.type}</span>
        {prop.default && <span>default: {prop.default}</span>}
      </div>
      <p className="text-sm leading-relaxed text-neutral-500 dark:text-white/60">
        {prop.description}
      </p>
    </div>
  )
}

function PropRow({ prop }: { prop: ComponentDoc["props"][number] }) {
  return (
    <tr className="border-t border-black/60 dark:border-white/10">
      <td className="py-3 pr-6 font-mono text-sm text-neutral-800 dark:text-white/90 whitespace-nowrap">
        <InlineCode>{prop.name}</InlineCode>
      </td>
      <td className="py-3 pr-6 font-mono text-sm text-neutral-500 dark:text-white/50 whitespace-nowrap">
        <InlineCode>{prop.type}</InlineCode>
      </td>
      <td className="py-3 pr-6 text-sm text-neutral-500 dark:text-white/50 whitespace-nowrap">
        {prop.required ? (
          <span className="text-neutral-600 dark:text-white/70">Yes</span>
        ) : (
          <span className="text-neutral-400 dark:text-white/30">No</span>
        )}
      </td>
      <td className="py-3 pr-6 font-mono text-sm text-neutral-400 dark:text-white/30 whitespace-nowrap">
        {prop.default ?? "—"}
      </td>
      <td className="py-3 text-sm text-neutral-500 dark:text-white/60 leading-relaxed">
        {prop.description}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function DocPageLayout({ doc }: { doc: ComponentDoc }) {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold break-words text-neutral-900 sm:text-3xl dark:text-white">
          {doc.name}
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          {doc.description}
        </p>
      </div>

      {/* Notes — caveats and warnings, rendered before Preview */}
      {doc.notes && doc.notes.length > 0 && <NoteList notes={doc.notes} />}

      {/* Default Preview */}
      {doc.preview !== null && (
        <section>
          <SectionHeading>Preview</SectionHeading>
          <PreviewBox>{doc.preview}</PreviewBox>
          {doc.previewCode && (
            <CodeBlock code={doc.importLine + "\n" + doc.previewCode} />
          )}
        </section>
      )}

      {/* Usage */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Usage</SectionHeading>
        <CodeBlock code={doc.importLine} />
        <CodeBlock code={doc.usage} />
      </section>

      {/* Examples */}
      {doc.examples && doc.examples.length > 0 && (
        <section className="flex flex-col gap-10">
          <SectionHeading>Examples</SectionHeading>
          {doc.examples.map((example) => (
            <div key={example.name} className="flex flex-col gap-3">
              <SubHeading>{example.name}</SubHeading>
              <p className="text-sm text-neutral-500 dark:text-white/50 -mt-1 mb-1">
                {example.description}
              </p>
              <PreviewBox>{example.preview}</PreviewBox>
              <CodeBlock code={example.code} />
            </div>
          ))}
        </section>
      )}

      {/* In Context */}
      {doc.inContext && (
        <section className="flex flex-col gap-4">
          <SectionHeading>In Context</SectionHeading>
          <p className="text-sm text-neutral-500 dark:text-white/50">
            {doc.inContext.description}
          </p>
          <PreviewBox>{doc.inContext.preview}</PreviewBox>
          <CodeBlock code={doc.inContext.code} />
        </section>
      )}

      {/* API Reference */}
      <section>
        <SectionHeading>API Reference</SectionHeading>
        <div className="flex flex-col sm:hidden">
          {doc.props.map((prop) => (
            <PropCard key={prop.name as string} prop={prop} />
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/60 dark:border-white/20">
                <th className="pb-3 pr-6 font-mono text-xs text-neutral-400 dark:text-white/40 font-normal uppercase tracking-wider">
                  Prop
                </th>
                <th className="pb-3 pr-6 font-mono text-xs text-neutral-400 dark:text-white/40 font-normal uppercase tracking-wider">
                  Type
                </th>
                <th className="pb-3 pr-6 font-mono text-xs text-neutral-400 dark:text-white/40 font-normal uppercase tracking-wider">
                  Required
                </th>
                <th className="pb-3 pr-6 font-mono text-xs text-neutral-400 dark:text-white/40 font-normal uppercase tracking-wider">
                  Default
                </th>
                <th className="pb-3 font-mono text-xs text-neutral-400 dark:text-white/40 font-normal uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.props.map((prop) => (
                <PropRow key={prop.name as string} prop={prop} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* States */}
      {doc.states && (
        <section>
          <SectionHeading>States</SectionHeading>
          <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
            {doc.states}
          </p>
        </section>
      )}
    </div>
  )
}
