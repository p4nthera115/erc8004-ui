import { createFileRoute } from "@tanstack/react-router"
import { HeroSection } from "@/components/landing/hero"
import MorphShape from "@/components/landing/MorphShape"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <>
      <HeroSection />
      <MorphShape />
    </>
  )
}
