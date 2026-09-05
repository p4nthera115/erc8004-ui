import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useRef, useState, useCallback } from "react"
import { TableOfContents } from "@/components/docs/TableOfContents"
import { DocsNavLinks } from "@/components/docs/nav-links"
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
      className="docs-sidebar min-h-full w-60 shrink-0 sticky top-[81px] hidden h-[calc(100svh-81px)] overflow-y-auto border-r border-black/60 py-8 pr-4 font-mono lg:block dark:border-white/25 order-1"
      style={{
        scrollbarColor: scrolling
          ? "rgba(128,128,128,0.25) transparent"
          : "transparent transparent",
      }}
    >
      <nav className="flex flex-col gap-6">
        <DocsNavLinks
          groupClassName="flex flex-col gap-1"
          titleClassName="text-[10px] text-text-muted tracking-widest mb-1 select-none"
          linkClassName="text-sm text-neutral-950 dark:text-white py-0.5 hover:bg-black/10 dark:hover:bg-white/20 px-2"
        />
      </nav>
    </aside>
  )
}

export const Route = createFileRoute("/docs")({
  component: () => (
    // DOM order: <main> first so prerendered HTML puts page content near the
    // top of the agent-converted output. Visual order is restored with
    // Tailwind `order-*` utilities — sidebar (1), main (2), TOC (3).
    <div className="mx-auto flex min-h-[calc(100svh-81px)] max-w-screen-2xl gap-8 px-4 sm:px-6">
      <main className="order-2 min-w-0 max-w-4xl flex-1 py-8 md:py-10">
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
