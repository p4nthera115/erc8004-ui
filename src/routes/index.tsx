import { createFileRoute } from "@tanstack/react-router"
import { HeroSection } from "@/components/landing/hero"
import { ComponentCarousel } from "@/components/landing/component-wall"
import { ChainStrip } from "@/components/landing/chains"
import { Comparison } from "@/components/landing/comparison"
import { Showcase } from "@/components/landing/showcase"
import { Features } from "@/components/landing/features"
import { ForAgents } from "@/components/landing/agents"
import { Quickstart } from "@/components/landing/quickstart"
import { Footer } from "@/components/landing/footer"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <>
      <HeroSection />
      <ComponentCarousel />
      <ChainStrip />
      <Comparison />
      <Showcase />
      <Features />
      <ForAgents />
      <Quickstart />
      <Footer />
    </>
  )
}
