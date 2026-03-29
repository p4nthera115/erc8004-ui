"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { isValidShopDomain } from "@/lib/utils"

export default function AuthPage() {
  const [shop, setShop] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Normalize shop domain
    let normalizedShop = shop.trim().toLowerCase()
    if (!normalizedShop.includes(".myshopify.com")) {
      normalizedShop = `${normalizedShop}.myshopify.com`
    }

    if (!isValidShopDomain(normalizedShop)) {
      setError("Please enter a valid Shopify store domain")
      return
    }

    setLoading(true)

    // Redirect to OAuth flow
    window.location.href = `/api/auth?shop=${encodeURIComponent(
      normalizedShop
    )}`
  }

  return (
    <div className="min-h-screen bg-obsidian-950 bg-luxury-mesh flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <span className="text-obsidian-950 font-bold">S3</span>
          </div>
          <span className="font-display text-2xl font-medium text-platinum-100">
            Showcase3D
          </span>
        </Link>

        <Card variant="glass" className="p-8">
          <div className="text-center mb-8">
            <h1 className="heading-display text-2xl text-platinum-50 mb-2">
              Install Showcase3D
            </h1>
            <p className="text-platinum-400">
              Enter your Shopify store domain to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-platinum-300 text-sm font-medium mb-2">
                Store Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  className="w-full px-4 py-3 bg-obsidian-800 border border-platinum-800/30 rounded-lg text-platinum-100 placeholder-platinum-500 focus:outline-none focus:border-gold-500/50 transition-colors pr-32"
                  placeholder="your-store"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-platinum-500 text-sm">
                  .myshopify.com
                </span>
              </div>
            </div>

            {error && (
              <motion.div
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              variant="luxury"
              className="w-full"
              isLoading={loading}
            >
              Install App
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-platinum-800/20 text-center">
            <p className="text-platinum-500 text-sm">
              By installing, you agree to our{" "}
              <Link href="/terms" className="text-gold-400 hover:text-gold-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-gold-400 hover:text-gold-300"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </Card>

        {/* Features reminder */}
        <motion.div
          className="mt-8 grid grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-platinum-400 text-xs">{feature.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

const features = [
  { icon: "⚡", label: "60fps Performance" },
  { icon: "🎨", label: "Studio Lighting" },
  { icon: "📱", label: "Mobile Ready" },
]
