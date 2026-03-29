"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Lazy load the 3D scene for performance
const Scene = dynamic(
  () => import("./Scene").then((mod) => ({ default: mod.Scene })),
  {
    ssr: false,
    loading: () => <ViewerSkeleton />,
  }
)

interface Viewer3DProps {
  modelUrl?: string
  productName?: string
  environmentPreset?:
    | "studio"
    | "city"
    | "sunset"
    | "night"
    | "warehouse"
    | "forest"
  autoRotate?: boolean
  className?: string
}

function ViewerSkeleton() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-obsidian-900/50 rounded-2xl">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 animate-pulse" />
        <div className="text-platinum-500 text-sm animate-pulse">
          Loading 3D Viewer...
        </div>
      </div>
    </div>
  )
}

const environmentPresets = [
  { id: "studio", label: "Studio", icon: "◯" },
  { id: "city", label: "City", icon: "⬛" },
  { id: "sunset", label: "Sunset", icon: "◐" },
  { id: "night", label: "Night", icon: "●" },
  { id: "warehouse", label: "Industrial", icon: "▢" },
  { id: "forest", label: "Nature", icon: "◇" },
] as const

export function Viewer3D({
  modelUrl,
  productName,
  environmentPreset: initialPreset = "studio",
  autoRotate: initialAutoRotate = true,
  className,
}: Viewer3DProps) {
  const [environment, setEnvironment] =
    useState<typeof initialPreset>(initialPreset)
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div
      className={cn(
        "relative",
        isFullscreen && "fixed inset-0 z-50 bg-obsidian-950",
        className
      )}
    >
      {/* Header */}
      {productName && (
        <motion.div
          className="absolute top-4 left-4 z-10"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-platinum-100 font-medium text-lg">
            {productName}
          </h3>
          <p className="text-platinum-500 text-sm">Interactive 3D View</p>
        </motion.div>
      )}

      {/* Toolbar */}
      <motion.div
        className="absolute top-4 right-4 z-10 flex items-center gap-2"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* Auto-rotate toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            autoRotate
              ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
              : "bg-obsidian-800/80 text-platinum-400 border border-platinum-700/30 hover:border-platinum-600/50"
          )}
          title={autoRotate ? "Disable auto-rotate" : "Enable auto-rotate"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            showSettings
              ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
              : "bg-obsidian-800/80 text-platinum-400 border border-platinum-700/30 hover:border-platinum-600/50"
          )}
          title="Environment settings"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg bg-obsidian-800/80 text-platinum-400 border border-platinum-700/30 hover:border-platinum-600/50 transition-all duration-200"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>
      </motion.div>

      {/* Environment Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="absolute top-16 right-4 z-10 p-4 rounded-xl bg-obsidian-900/90 backdrop-blur-xl border border-platinum-800/30 shadow-2xl"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-platinum-400 text-xs uppercase tracking-wider mb-3">
              Environment
            </p>
            <div className="grid grid-cols-3 gap-2">
              {environmentPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setEnvironment(preset.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200",
                    environment === preset.id
                      ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
                      : "bg-obsidian-800/50 text-platinum-400 border border-transparent hover:border-platinum-700/30"
                  )}
                >
                  <span className="text-lg">{preset.icon}</span>
                  <span className="text-xs">{preset.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <div
        className={cn(
          "w-full",
          isFullscreen ? "h-screen" : "h-[500px] rounded-2xl overflow-hidden"
        )}
      >
        <Scene
          modelUrl={modelUrl}
          environmentPreset={environment}
          autoRotate={autoRotate}
          showControls={!isFullscreen}
        />
      </div>
    </div>
  )
}
