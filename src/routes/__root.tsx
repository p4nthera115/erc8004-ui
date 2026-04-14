import { createRootRoute, Outlet } from "@tanstack/react-router"
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

export const Route = createRootRoute({ component: RootComponent })
