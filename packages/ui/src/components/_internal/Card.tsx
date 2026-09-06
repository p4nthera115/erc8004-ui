import { cn } from "../../lib/cn"
import type { ReactNode } from "react"

interface CardProps {
  shadow?: boolean
  /** Marks the card as loading for assistive tech. */
  busy?: boolean
  className?: string
  children: ReactNode
}

export function Card({ shadow, busy, className, children }: CardProps) {
  return (
    <div
      aria-busy={busy || undefined}
      className={cn(
        "bg-erc8004-card text-erc8004-card-fg border border-erc8004-border rounded-erc8004-lg",
        shadow && "shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}
