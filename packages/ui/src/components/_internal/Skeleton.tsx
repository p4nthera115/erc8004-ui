import { cn } from "../../lib/cn"
import type { CSSProperties } from "react"

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

/**
 * A loading placeholder.
 *
 * Hidden from assistive tech: a skeleton carries no content, and a card full
 * of them previously announced one empty `aria-live` region per box. The
 * container that owns the loading state carries `aria-busy` instead.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-erc8004-muted animate-pulse rounded-erc8004-sm",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
}
