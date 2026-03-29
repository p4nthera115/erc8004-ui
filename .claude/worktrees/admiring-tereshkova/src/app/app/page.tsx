"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface Model {
  id: string
  name: string
  thumbnailUrl: string | null
  productId: string | null
  viewCount: number
  status: "DRAFT" | "PROCESSING" | "ACTIVE" | "ARCHIVED"
  createdAt: string
}

interface StoreStats {
  totalModels: number
  totalViews: number
  activeModels: number
}

export default function AppDashboard() {
  const [models, setModels] = useState<Model[]>([])
  const [stats, setStats] = useState<StoreStats>({
    totalModels: 0,
    totalViews: 0,
    activeModels: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Get shop from URL params (in real app, this comes from Shopify session)
  const shop =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("shop")
      : null

  useEffect(() => {
    if (shop) {
      fetchModels()
    } else {
      setLoading(false)
    }
  }, [shop])

  async function fetchModels() {
    try {
      const response = await fetch(`/api/models?shop=${shop}`)
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
        setStats({
          totalModels: data.count || 0,
          totalViews:
            data.models?.reduce(
              (acc: number, m: Model) => acc + m.viewCount,
              0
            ) || 0,
          activeModels:
            data.models?.filter((m: Model) => m.status === "ACTIVE").length ||
            0,
        })
      }
    } catch (error) {
      console.error("Error fetching models:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-950 bg-luxury-mesh">
      {/* App Header */}
      <header className="border-b border-platinum-800/10 bg-obsidian-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-obsidian-950 font-bold text-sm">S3</span>
            </div>
            <span className="font-display text-xl font-medium text-platinum-100">
              Showcase3D
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Settings
            </Button>
            <Button
              variant="luxury"
              size="sm"
              onClick={() => setShowUploadModal(true)}
            >
              + Add Model
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="heading-display text-3xl text-platinum-50 mb-2">
            Welcome to Showcase3D
          </h1>
          <p className="text-platinum-400">
            Manage your 3D product models and viewer settings.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gold-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                  />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-display font-medium text-platinum-100">
                  {stats.totalModels}
                </div>
                <div className="text-platinum-400 text-sm">Total Models</div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gold-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-display font-medium text-platinum-100">
                  {stats.totalViews.toLocaleString()}
                </div>
                <div className="text-platinum-400 text-sm">Total Views</div>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gold-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-display font-medium text-platinum-100">
                  {stats.activeModels}
                </div>
                <div className="text-platinum-400 text-sm">Active Models</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Models Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-display text-2xl text-platinum-100">
              Your 3D Models
            </h2>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="glass" className="overflow-hidden">
                  <div className="aspect-square bg-obsidian-800 animate-pulse" />
                  <CardContent>
                    <div className="h-5 w-2/3 bg-obsidian-800 rounded animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-obsidian-800 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : models.length === 0 ? (
            <Card variant="glass" className="p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gold-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-platinum-100 mb-2">
                No models yet
              </h3>
              <p className="text-platinum-400 mb-6 max-w-md mx-auto">
                Upload your first 3D model to start creating immersive product
                experiences for your customers.
              </p>
              <Button variant="luxury" onClick={() => setShowUploadModal(true)}>
                Upload Your First Model
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card
                    variant="glass"
                    hover
                    className="overflow-hidden group cursor-pointer"
                  >
                    <div className="aspect-square bg-obsidian-800 relative overflow-hidden">
                      {model.thumbnailUrl ? (
                        <img
                          src={model.thumbnailUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg
                              className="w-8 h-8 text-gold-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            model.status === "ACTIVE" &&
                              "bg-green-500/20 text-green-400 border border-green-500/30",
                            model.status === "DRAFT" &&
                              "bg-platinum-500/20 text-platinum-400 border border-platinum-500/30",
                            model.status === "PROCESSING" &&
                              "bg-gold-500/20 text-gold-400 border border-gold-500/30",
                            model.status === "ARCHIVED" &&
                              "bg-red-500/20 text-red-400 border border-red-500/30"
                          )}
                        >
                          {model.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <CardContent>
                      <h3 className="text-platinum-100 font-medium mb-1 truncate">
                        {model.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-platinum-500">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {model.viewCount}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(model.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Start Guide */}
        {models.length === 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="heading-display text-2xl text-platinum-100 mb-6">
              Quick Start Guide
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {quickStartSteps.map((step, index) => (
                <Card key={index} variant="glass" className="p-6">
                  <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-medium mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-platinum-100 font-medium mb-2">
                    {step.title}
                  </h3>
                  <p className="text-platinum-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            shop={shop}
            onSuccess={fetchModels}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function UploadModal({
  onClose,
  shop,
  onSuccess,
}: {
  onClose: () => void
  shop: string | null
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [modelUrl, setModelUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!shop || !name || !modelUrl) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/models?shop=${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, modelUrl }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create model")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-display text-2xl text-platinum-100">
              Add 3D Model
            </h2>
            <button
              onClick={onClose}
              className="text-platinum-400 hover:text-platinum-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-platinum-300 text-sm font-medium mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-obsidian-800 border border-platinum-800/30 rounded-lg text-platinum-100 placeholder-platinum-500 focus:outline-none focus:border-gold-500/50 transition-colors"
                placeholder="e.g., Luxury Watch"
                required
              />
            </div>

            <div>
              <label className="block text-platinum-300 text-sm font-medium mb-2">
                Model URL (GLB/GLTF)
              </label>
              <input
                type="url"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                className="w-full px-4 py-3 bg-obsidian-800 border border-platinum-800/30 rounded-lg text-platinum-100 placeholder-platinum-500 focus:outline-none focus:border-gold-500/50 transition-colors"
                placeholder="https://cdn.example.com/model.glb"
                required
              />
              <p className="text-platinum-500 text-xs mt-2">
                Enter a URL to your GLB or GLTF file. You can host files on
                Shopify Files or any CDN.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="luxury" isLoading={loading}>
                Add Model
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  )
}

const quickStartSteps = [
  {
    title: "Upload your 3D model",
    description:
      "Upload a GLB or GLTF file of your product. We support models up to 50MB with optimized compression.",
  },
  {
    title: "Customize the viewer",
    description:
      "Adjust lighting, rotation settings, and camera angles to showcase your product perfectly.",
  },
  {
    title: "Add to your store",
    description:
      "Use the Theme App Extension to add the 3D viewer block to any product page in your theme editor.",
  },
]
