import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Showcase3D | Premium 3D Product Visualization",
  description:
    "Transform your Shopify store with stunning 3D product experiences. Premium visualization for luxury brands.",
  keywords: [
    "3D",
    "product visualization",
    "Shopify",
    "ecommerce",
    "3D viewer",
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-obsidian-950 texture-noise">
        {children}
      </body>
    </html>
  )
}
