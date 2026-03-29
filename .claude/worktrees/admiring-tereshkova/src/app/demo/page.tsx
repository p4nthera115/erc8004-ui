"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Viewer3D } from "@/components/viewer"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-obsidian-950 bg-luxury-mesh">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-platinum-800/10 bg-obsidian-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-obsidian-950 font-bold text-sm">S3</span>
            </div>
            <span className="font-display text-xl font-medium text-platinum-100">
              Showcase3D
            </span>
          </Link>
          <Link href="/auth" className="btn-luxury text-sm">
            Install App
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium mb-6">
              Interactive Demo
            </span>
            <h1 className="heading-display text-4xl md:text-5xl text-platinum-50 mb-4">
              Experience the viewer
            </h1>
            <p className="text-platinum-400 text-lg max-w-2xl mx-auto">
              Interact with our 3D viewer below. Drag to rotate, scroll to zoom,
              and try different lighting environments.
            </p>
          </motion.div>

          {/* Main Viewer */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Viewer3D
              productName="Luxury Product Demo"
              environmentPreset="studio"
              autoRotate={true}
              className="glow-gold"
            />
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {demoFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-glass p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/20 flex items-center justify-center mb-4">
                  <span className="text-gold-400">{feature.icon}</span>
                </div>
                <h3 className="text-platinum-100 font-medium mb-2">
                  {feature.title}
                </h3>
                <p className="text-platinum-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Integration Preview */}
          <motion.div
            className="mt-16 card-glass p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="heading-display text-2xl text-platinum-100 mb-4">
              Easy Integration
            </h2>
            <p className="text-platinum-400 mb-6">
              Add 3D viewers to any product page using our Theme App Extension.
              No code required.
            </p>
            <div className="bg-obsidian-950 rounded-lg p-4 font-mono text-sm">
              <div className="text-platinum-500 mb-2">
                {/* Theme customization UI */}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-obsidian-900/50 border border-platinum-800/20">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <span className="text-obsidian-950 text-xs font-bold">
                    3D
                  </span>
                </div>
                <div>
                  <div className="text-platinum-200 text-sm">
                    Showcase3D Viewer
                  </div>
                  <div className="text-platinum-500 text-xs">
                    App Block • Drag to add
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="heading-display text-3xl text-platinum-100 mb-4">
              Ready to get started?
            </h2>
            <p className="text-platinum-400 mb-8">
              Install Showcase3D on your Shopify store today.
            </p>
            <Link href="/auth" className="btn-luxury">
              Install Free
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

const demoFeatures = [
  {
    icon: "🎮",
    title: "Full Interactivity",
    description:
      "Customers can rotate, zoom, and explore products from every angle.",
  },
  {
    icon: "💡",
    title: "Dynamic Lighting",
    description:
      "Six professional lighting environments to showcase products perfectly.",
  },
  {
    icon: "⚡",
    title: "Optimized Performance",
    description: "Lazy-loaded and optimized for 60fps even on mobile devices.",
  },
]
