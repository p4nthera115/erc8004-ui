import { cn } from "@/lib/cn"

interface EmptyStateProps {
  message: string
  className?: string
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <p className="text-erc8004-muted-fg text-sm">{message}</p>
    </div>
  )
}
