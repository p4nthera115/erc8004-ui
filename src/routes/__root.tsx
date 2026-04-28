import { createRootRoute, Outlet, Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Nav } from "../components/Nav"

function RootComponent() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme")
    return stored ? stored === "dark" : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark])

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

function RootNotFound() {
  return (
    <main className="max-w-2xl mx-auto py-24 px-6 font-mono">
      <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
        404 — Page not found
      </h1>
      <p className="mb-8 text-neutral-600 dark:text-white/60 leading-relaxed">
        That page doesn&apos;t exist. The agent-readable index is at{" "}
        <a className="underline" href="/llms.txt">
          /llms.txt
        </a>
        .
      </p>
      <Link
        to="/docs/introduction"
        className="underline text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
      >
        Back to documentation →
      </Link>
    </main>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: RootNotFound,
})
