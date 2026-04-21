import { cn } from "@/lib/cn"
import type { CSSProperties } from "react"

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-erc8004-muted animate-pulse rounded-erc8004-sm",
        className
      )}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  )
}
