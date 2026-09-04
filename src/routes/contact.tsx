import { createFileRoute } from "@tanstack/react-router"
import { SitePageView } from "@/components/SitePageView"
import { Footer } from "@/components/landing/footer"
import { SITE_PAGES } from "@/content/site-pages"

export const Route = createFileRoute("/contact")({
  component: ContactPage,
})

function ContactPage() {
  return (
    <>
      <SitePageView page={SITE_PAGES.contact} />
      <Footer />
    </>
  )
}
