import { Link, useLocation } from "@tanstack/react-router"
import { NAV, flattenNav } from "./nav"

const FLAT_NAV = flattenNav(NAV)

export function DocsPagination() {
  const { pathname } = useLocation()

  const currentIndex = FLAT_NAV.findIndex((item) => item.path === pathname)
  if (currentIndex === -1) return null

  const prev = currentIndex > 0 ? FLAT_NAV[currentIndex - 1] : null
  const next =
    currentIndex < FLAT_NAV.length - 1 ? FLAT_NAV[currentIndex + 1] : null

  return (
    <div className="mt-16 flex items-center justify-between gap-4 border-t border-black/60 pt-8 font-mono dark:border-white/10">
      {prev ? (
        prev.slug ? (
          <Link
            to="/docs/components/$slug"
            params={{ slug: prev.slug }}
            className="group flex min-w-0 max-w-[45%] items-center gap-2 px-1 text-neutral-500 hover:text-neutral-900 sm:px-4 dark:text-white/70 dark:hover:text-white"
          >
            <span className="shrink-0 text-xl">←</span>
            <span className="truncate text-sm transition-colors">
              {prev.label}
            </span>
          </Link>
        ) : (
          <Link
            to={prev.to as "/docs/introduction" | "/docs/installation" | "/docs/concepts" | "/docs/api-keys" | "/docs/components" | "/docs/theming"}
            className="group flex min-w-0 max-w-[45%] items-center gap-2 px-1 text-neutral-500 hover:text-neutral-900 sm:px-4 dark:text-white/70 dark:hover:text-white"
          >
            <span className="shrink-0 text-xl">←</span>
            <span className="truncate text-sm transition-colors">
              {prev.label}
            </span>
          </Link>
        )
      ) : (
        <div />
      )}

      {next ? (
        next.slug ? (
          <Link
            to="/docs/components/$slug"
            params={{ slug: next.slug }}
            className="group flex min-w-0 max-w-[45%] items-center gap-2 px-1 text-neutral-500 hover:text-neutral-900 sm:px-4 dark:text-white/70 dark:hover:text-white"
          >
            <span className="truncate text-sm transition-colors">
              {next.label}
            </span>
            <span className="shrink-0 text-xl">→</span>
          </Link>
        ) : (
          <Link
            to={next.to as "/docs/introduction" | "/docs/installation" | "/docs/concepts" | "/docs/api-keys" | "/docs/components" | "/docs/theming"}
            className="group flex min-w-0 max-w-[45%] items-center gap-2 px-1 text-neutral-500 hover:text-neutral-900 sm:px-4 dark:text-white/70 dark:hover:text-white"
          >
            <span className="truncate text-sm transition-colors">
              {next.label}
            </span>
            <span className="shrink-0 text-xl">→</span>
          </Link>
        )
      ) : (
        <div />
      )}
    </div>
  )
}
