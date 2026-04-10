import type { ComponentDoc } from "./registry"
import { CodeBlock, InlineCode } from "./CodeBlock"

export { CodeBlock, InlineCode }

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

function PropRow({ prop }: { prop: ComponentDoc["props"][number] }) {
  return (
    <tr className="border-t border-black/60 dark:border-white/10">
      <td className="py-3 pr-6 font-mono text-sm text-neutral-800 dark:text-white/90 whitespace-nowrap">
        {prop.name}
      </td>
      <td className="py-3 pr-6 font-mono text-sm text-neutral-500 dark:text-white/50 whitespace-nowrap">
        {prop.type}
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
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          {doc.name}
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          {doc.description}
        </p>
      </div>

      {/* Preview */}
      {doc.preview !== null && (
        <section>
          <SectionHeading>Preview</SectionHeading>
          <div className="rounded border border-black/60 dark:border-white/10 bg-neutral-50 dark:bg-white/2 p-8 flex items-center justify-center min-h-32">
            {doc.preview}
          </div>
        </section>
      )}

      {/* Usage */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Usage</SectionHeading>
        <CodeBlock code={doc.importLine} />
        <CodeBlock code={doc.usage} />
      </section>

      {/* API Reference */}
      <section>
        <SectionHeading>API Reference</SectionHeading>
        <div className="overflow-x-auto">
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
                <PropRow key={prop.name} prop={prop} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
