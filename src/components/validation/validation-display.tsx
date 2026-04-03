import { type AgentIdentityProps } from "@/lib/useAgentIdentity"
import { VerificationBadge } from "./verification-badge"
import { ValidationScore } from "./validation-score"
import { ValidationList } from "./validation-list"

export function ValidationDisplay(props: AgentIdentityProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <VerificationBadge {...props} />
      </div>
      <ValidationScore {...props} />
      <ValidationList {...props} />
    </div>
  )
}
