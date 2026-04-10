import { useState, useEffect, useRef } from "react"
import { useLocation } from "@tanstack/react-router"

type Heading = {
  id: string
  text: string
  level: 2 | 3
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const visibleIds = useRef<Set<string>>(new Set())
  const suppressObserver = useRef(false)
  const suppressTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const location = useLocation()

  // Scan DOM for headings after each route change
  useEffect(() => {
    const timer = setTimeout(() => {
      const main = document.querySelector("main")
      if (!main) return

      const elements = main.querySelectorAll("h2, h3")
      const found: Heading[] = []

      elements.forEach((el) => {
        const text = el.textContent?.trim() ?? ""
        if (!text) return
        const level = el.tagName === "H2" ? (2 as const) : (3 as const)
        if (!el.id) el.id = slugify(text)
        found.push({ id: el.id, text, level })
      })

      setHeadings(found)
      visibleIds.current.clear()
      setActiveId(found[0]?.id ?? "")
    }, 50)

    return () => clearTimeout(timer)
  }, [location.pathname])

  // IntersectionObserver to track active heading
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleIds.current.add(entry.target.id)
          } else {
            visibleIds.current.delete(entry.target.id)
          }
        })

        if (suppressObserver.current) return

        // Highlight the first visible heading in document order
        const first = headings.find((h) => visibleIds.current.has(h.id))
        if (first) setActiveId(first.id)
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    // Edge case: when scrolled to the bottom, activate the last heading
    function onScroll() {
      if (suppressObserver.current) return
      const nearBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 80
      if (nearBottom && headings.length > 0) {
        setActiveId(headings[headings.length - 1].id)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [headings])

  if (headings.length < 2) return null

  return (
    <aside className="hidden xl:block w-52 shrink-0 sticky top-[81px] h-[calc(100svh-81px)] overflow-y-auto py-8 pl-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-white/30 mb-4 select-none">
        On This Page
      </p>
      <nav>
        <ul className="flex flex-col border-l border-black/20 dark:border-white/10">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  suppressObserver.current = true
                  if (suppressTimer.current) clearTimeout(suppressTimer.current)
                  suppressTimer.current = setTimeout(() => {
                    suppressObserver.current = false
                  }, 800)
                  const el = document.getElementById(h.id)
                  if (el) {
                    const top =
                      el.getBoundingClientRect().top + window.scrollY - 100
                    window.scrollTo({ top, behavior: "smooth" })
                  }
                  setActiveId(h.id)
                }}
                className={[
                  "block py-1 text-xs leading-relaxed transition-colors duration-150",
                  h.level === 3 ? "pl-5 text-[11px]" : "pl-3",
                  activeId === h.id
                    ? "text-neutral-900 dark:text-white font-medium border-l border-black dark:border-white -ml-px"
                    : "text-neutral-400 dark:text-white/40 hover:text-neutral-600 dark:hover:text-white/70",
                ].join(" ")}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
