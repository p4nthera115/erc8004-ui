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
    <>
      <style>{`
        .docs-sidebar::-webkit-scrollbar { width: 4px; }
        .docs-sidebar::-webkit-scrollbar-track { background: transparent; }
        .docs-sidebar::-webkit-scrollbar-thumb { background: transparent; border-radius: 0px; transition: background 0.3s; }
        .docs-sidebar[data-scrolling="true"]::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 0px; }
      `}</style>

      <aside
        ref={ref}
        onScroll={handleScroll}
        data-scrolling={scrolling}
        className="docs-sidebar min-h-full w-60 shrink-0 sticky top-[81px] h-[calc(100svh-81px)] overflow-y-auto py-8 pr-4 border-r border-white/25 font-mono"
        style={{
          scrollbarColor: scrolling
            ? "rgba(255,255,255,0.25) transparent"
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
                    className="text-sm text-white py-0.5 hover:bg-white/20 px-2"
                    activeProps={{ className: "text-sm text-text py-0.5" }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="text-sm text-white py-0.5 hover:bg-white/20 px-2"
                    activeProps={{ className: "text-sm text-text py-0.5" }}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

export const Route = createFileRoute("/docs")({
  component: () => (
    <div className="max-w-screen-2xl mx-auto px-6 flex gap-8 min-h-[calc(100vh-3.5rem)]">
      <DocsSidebar />
      <main className="flex-1 min-w-0 py-10 max-w-3xl">
        <Outlet />
        <DocsPagination />
      </main>
      <TableOfContents />
    </div>
  ),
})
