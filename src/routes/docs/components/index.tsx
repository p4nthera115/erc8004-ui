import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/docs/components/")({
  beforeLoad: () => {
    throw redirect({
      to: "/docs/components/$slug",
      params: { slug: "erc8004-provider" },
    })
  },
  component: () => null,
})
