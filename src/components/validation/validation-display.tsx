import { type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { cn } from "@/lib/cn"
import { VerificationBadge } from "./verification-badge"
import { ValidationScore } from "./validation-score"
import { ValidationList } from "./validation-list"

interface ValidationDisplayProps extends AgentIdentityProps {
  className?: string
}

export function ValidationDisplay({ className, ...props }: ValidationDisplayProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center gap-3">
        <VerificationBadge {...props} />
      </div>
      <ValidationScore {...props} />
      <ValidationList {...props} />
    </div>
  )
}
