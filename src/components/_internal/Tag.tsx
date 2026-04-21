import { cn } from "@/lib/cn"
import type { ReactNode } from "react"

type TagVariant = "default" | "accent" | "positive" | "negative"

const variantClasses: Record<TagVariant, string> = {
  default: "bg-erc8004-muted text-erc8004-muted-fg",
  accent: "bg-erc8004-accent text-erc8004-accent-fg",
  positive: "bg-erc8004-positive text-erc8004-positive-fg",
  negative: "bg-erc8004-negative text-erc8004-negative-fg",
}

interface TagProps {
  variant?: TagVariant
  className?: string
  children: ReactNode
}

export function Tag({ variant = "default", className, children }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-erc8004-sm",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
