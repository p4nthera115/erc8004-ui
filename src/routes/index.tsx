import { createFileRoute } from "@tanstack/react-router"
import { HeroSection } from "@/components/landing/hero"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return <HeroSection />
}
