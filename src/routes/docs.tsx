import { createFileRoute, Outlet, Link } from "@tanstack/react-router"
import { useRef, useState, useCallback } from "react"
import { TableOfContents } from "@/components/docs/TableOfContents"
import { NAV } from "@/components/docs/nav"
import { DocsPagination } from "@/components/docs/DocsPagination"

function DocsSidebar() {
  const ref = useRef<HTMLElement>(null)
  const [scrolling, setScrolling] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleScroll = useCallback(() => {
    setScrolling(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setScrolling(false), 800)
  }, [])

  return (
    <aside
      ref={ref}
      onScroll={handleScroll}
      data-scrolling={scrolling}
      className="docs-sidebar min-h-full w-60 shrink-0 sticky top-[81px] h-[calc(100svh-81px)] overflow-y-auto py-8 pr-4 border-r border-black/60 dark:border-white/25 font-mono order-1"
      style={{
        scrollbarColor: scrolling
          ? "rgba(128,128,128,0.25) transparent"
          : "transparent transparent",
      }}
    >
      <nav className="flex flex-col gap-6">
        {NAV.map((group, i) => (
          <div key={i} className="flex flex-col gap-1">
            {group.title && (
              <span className="text-[10px] text-text-muted tracking-widest mb-1 select-none">
                {group.title}
              </span>
            )}
            {group.items.map((item) =>
              "slug" in item ? (
                <Link
                  key={item.slug}
                  to={item.to}
                  params={{ slug: item.slug }}
                  className="text-sm text-neutral-950 dark:text-white py-0.5 hover:bg-black/10 dark:hover:bg-white/20 px-2"
                  activeProps={{
                    className: "bg-black/10 dark:bg-white/15 font-medium",
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  activeOptions={{ exact: true }}
                  className="text-sm text-neutral-950 dark:text-white py-0.5 hover:bg-black/5 dark:hover:bg-white/20 px-2"
                  activeProps={{
                    className: "bg-black/10 dark:bg-white/15 font-medium",
                  }}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export const Route = createFileRoute("/docs")({
  component: () => (
    // DOM order: <main> first so prerendered HTML puts page content near the
    // top of the agent-converted output. Visual order is restored with
    // Tailwind `order-*` utilities — sidebar (1), main (2), TOC (3).
    <div className="max-w-screen-2xl mx-auto px-6 flex gap-8 min-h-[calc(100vh-3.5rem)]">
      <main className="flex-1 min-w-0 py-10 max-w-4xl order-2">
        {/*
          Agent-facing directive. Visually hidden via `sr-only`, but in DOM
          order before content so agents that strip presentation see it first.
          This satisfies AFDocs' "LLMS TXT Directive" check.
        */}
        {/*
          data-markdown-ignore tells AFDocs (and other agent tooling) to skip
          this element when comparing HTML to the markdown twin: this preamble
          and the pagination footer are page chrome that the markdown source
          intentionally doesn't carry.
        */}
        <blockquote className="sr-only" data-markdown-ignore>
          For the complete documentation index, see{" "}
          <a href="/llms.txt">/llms.txt</a>. A single-fetch full bundle is at{" "}
          <a href="/llms-full.txt">/llms-full.txt</a>. Every docs page is also
          available as Markdown by appending <code>.md</code> to its URL, or by
          requesting it with <code>Accept: text/markdown</code>.
        </blockquote>
        <Outlet />
        <div data-markdown-ignore>
          <DocsPagination />
        </div>
      </main>
      <DocsSidebar />
      <TableOfContents />
    </div>
  ),
})
