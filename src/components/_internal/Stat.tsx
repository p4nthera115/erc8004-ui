import { cn } from "@/lib/cn"

interface StatProps {
  value: string | number
  label: string
  className?: string
}

export function Stat({ value, label, className }: StatProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-3xl font-semibold tabular-nums text-erc8004-card-fg">
        {value}
      </span>
      <span className="text-xs text-erc8004-muted-fg uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}
