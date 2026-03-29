"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function HomePage() {
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
          <div className="flex items-center gap-4">
            <Link
              href="/demo"
              className="text-platinum-400 hover:text-platinum-200 transition-colors text-sm"
            >
              Live Demo
            </Link>
            <Link href="/auth" className="btn-luxury text-sm">
              Install App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-20 px-6"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="max-w-4xl" variants={fadeInUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium mb-8">
              Premium 3D Visualization for Shopify
            </span>
            <h1 className="heading-display text-5xl md:text-7xl text-platinum-50 mb-6">
              Elevate your products with{" "}
              <span className="text-gradient-gold">immersive 3D</span>
            </h1>
            <p className="text-xl text-platinum-400 max-w-2xl mb-10 leading-relaxed">
              Transform static product images into stunning interactive 3D
              experiences. Built for luxury brands that demand excellence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth" className="btn-luxury">
                Start Free Trial
              </Link>
              <Link href="/demo" className="btn-ghost">
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Hero 3D Preview */}
          <motion.div
            className="mt-16 relative"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
          >
            <div className="aspect-[16/9] rounded-2xl bg-obsidian-900/60 border border-platinum-800/20 overflow-hidden glow-gold">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/20 border border-gold-500/30 flex items-center justify-center mx-auto mb-4 animate-float">
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
                  <p className="text-platinum-500 text-sm">
                    Interactive 3D Viewer
                  </p>
                </div>
              </div>
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950/50 via-transparent to-obsidian-950/50 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-24 px-6 border-t border-platinum-800/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-display text-4xl md:text-5xl text-platinum-50 mb-4">
              Crafted for Excellence
            </h2>
            <p className="text-platinum-400 text-lg max-w-2xl mx-auto">
              Every detail optimized for the premium shopping experience your
              brand deserves.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-glass p-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl mb-6 flex items-center justify-center",
                    "bg-gradient-to-br from-gold-500/20 to-gold-600/10",
                    "border border-gold-500/20"
                  )}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium text-platinum-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-platinum-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-obsidian-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-display font-medium text-gradient-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-platinum-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-display text-4xl md:text-5xl text-platinum-50 mb-6">
              Ready to transform your store?
            </h2>
            <p className="text-platinum-400 text-lg mb-10 max-w-2xl mx-auto">
              Join hundreds of premium brands using Showcase3D to create
              unforgettable shopping experiences.
            </p>
            <Link href="/auth" className="btn-luxury text-lg px-8 py-4">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-platinum-800/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-obsidian-950 font-bold text-xs">S3</span>
            </div>
            <span className="text-platinum-500 text-sm">
              © 2026 Showcase3D. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-platinum-500">
            <Link
              href="/privacy"
              className="hover:text-platinum-300 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-platinum-300 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="hover:text-platinum-300 transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: "60fps Performance",
    description:
      "Optimized rendering pipeline ensures silky-smooth interactions on any device, including mobile.",
    icon: (
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
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Native Theme Blocks",
    description:
      "Seamless integration using Shopify Theme App Extensions. No code edits required.",
    icon: (
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
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
  },
  {
    title: "Studio Lighting",
    description:
      "Professional HDRI environments and customizable lighting presets for product perfection.",
    icon: (
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
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
]

const stats = [
  { value: "60fps", label: "Smooth Performance" },
  { value: "< 2s", label: "Load Time" },
  { value: "40%", label: "Higher Engagement" },
  { value: "25%", label: "Fewer Returns" },
]
