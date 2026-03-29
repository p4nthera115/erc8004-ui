import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Showcase3D",
  description: "Manage your 3D product models and viewer settings",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
