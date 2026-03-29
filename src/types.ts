export interface SharedProps {
  agentRegistry: string  // "eip155:{chainId}:{contractAddress}"
  agentId: number        // ERC-721 token ID
}

export interface AgentData {
  name: string
  version: string
  description?: string
  endpoints?: EndpointDefinition[]
  capabilities?: string[]
  metadata?: Record<string, unknown>
}

export interface EndpointDefinition {
  url: string
  protocol: string
  description?: string
}

export interface ReputationData {
  stats: AgentStats
  feedback: Feedback[]
}

export interface AgentStats {
  totalFeedback: number
  averageValue: number
  totalValidations: number
  completedValidations: number
  averageValidationScore: number
  lastActivity: number
}

export interface Feedback {
  id: string
  clientAddress: string
  value: number
  tag1: string | null
  tag2: string | null
  isRevoked: boolean
  createdAt: number
  feedbackFile: FeedbackFile | null
  responses: FeedbackResponse[]
}

export interface FeedbackFile {
  text: string | null
  mcpTool: string | null
  a2aSkills: string[]
  oasfSkills: string[]
  oasfDomains: string[]
}

export interface FeedbackResponse {
  text: string
  createdAt: number
}
