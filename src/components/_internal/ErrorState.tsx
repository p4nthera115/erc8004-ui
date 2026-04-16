import { cn } from "@/lib/cn"

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <p className="text-erc8004-muted-fg text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-erc8004-muted hover:bg-erc8004-border text-erc8004-fg text-sm px-3 py-1.5 rounded-erc8004-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-erc8004-ring"
        >
          Retry
        </button>
      )}
    </div>
  )
}
