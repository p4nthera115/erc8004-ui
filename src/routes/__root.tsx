import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useState, useEffect, useLayoutEffect } from "react"
import { Nav } from "../components/Nav"
import { NotFoundPage } from "../components/NotFoundPage"
import { applyPageMeta } from "../lib/page-meta"

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme")
    return stored ? stored === "dark" : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark])

  // Title, description, canonical and og:url for the current route. Declared
  // before the app-rendered effect below so the prerenderer's snapshot already
  // has them; a layout effect so a client-side navigation updates the tab
  // title in the same frame as the content.
  useLayoutEffect(() => {
    applyPageMeta(pathname)
  }, [pathname])

  useEffect(() => {
    // Tell the prerenderer the page is ready to be snapshotted
    document.dispatchEvent(new Event("app-rendered"))
  }, [])

  return (
    <div className="min-h-screen erc8004">
      <Nav isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})
