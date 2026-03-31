// === Component Props ===

export interface SharedProps {
  agentRegistry: string // "eip155:{chainId}:{contractAddress}"
  agentId: number // ERC-721 token ID
}

// === Agent ===

export interface AgentData {
  id: string // "chainId:agentId"
  chainId: number
  agentId: number
  agentURI: string | null
  agentURIType: string | null
  owner: string
  agentWallet: string | null
  operators: string[]
  createdAt: number
  updatedAt: number
  totalFeedback: number
  lastActivity: number
  registrationFile: AgentRegistrationFile | null
}

export interface AgentRegistrationFile {
  id: string
  cid: string
  agentId: string
  name: string | null
  description: string | null
  image: string | null
  active: boolean | null
  x402Support: boolean | null
  supportedTrusts: string[]
  endpointsRawJson: string | null
  mcpEndpoint: string | null
  mcpVersion: string | null
  a2aEndpoint: string | null
  a2aVersion: string | null
  webEndpoint: string | null
  oasfEndpoint: string | null
  oasfVersion: string | null
  oasfSkills: string[]
  oasfDomains: string[]
  emailEndpoint: string | null
  ens: string | null
  did: string | null
  mcpTools: string[]
  mcpPrompts: string[]
  mcpResources: string[]
  a2aSkills: string[]
  createdAt: number
}

// === Reputation ===

export interface ReputationData {
  stats: AgentStats | null
  feedback: Feedback[]
}

export interface AgentStats {
  id: string // "chainId:agentId"
  totalFeedback: number
  averageFeedbackValue: number // BigDecimal — parsed from string
  totalValidations: number
  completedValidations: number
  averageValidationScore: number
  lastActivity: number
  updatedAt: number
}

export interface Feedback {
  id: string // "chainId:agentId:clientAddress:feedbackIndex"
  clientAddress: string
  feedbackIndex: number
  value: number // BigDecimal — parsed from string
  tag1: string | null
  tag2: string | null
  endpoint: string | null
  feedbackURI: string | null
  feedbackURIType: string | null
  feedbackHash: string | null
  isRevoked: boolean
  createdAt: number
  revokedAt: number | null
  feedbackFile: FeedbackFile | null
  responses: FeedbackResponse[]
}

export interface FeedbackFile {
  id: string
  cid: string
  feedbackId: string
  agentRegistry: string | null
  agentId: number | null
  clientAddress: string | null
  createdAtIso: string | null
  valueRaw: number | null
  valueDecimals: number | null
  text: string | null
  mcpTool: string | null
  mcpPrompt: string | null
  mcpResource: string | null
  a2aSkills: string[]
  a2aContextId: string | null
  a2aTaskId: string | null
  oasfSkills: string[]
  oasfDomains: string[]
  proofOfPaymentFromAddress: string | null
  proofOfPaymentToAddress: string | null
  proofOfPaymentChainId: string | null
  proofOfPaymentTxHash: string | null
  tag1: string | null
  tag2: string | null
  createdAt: number
}

export interface FeedbackResponse {
  id: string
  responder: string // Bytes — wallet address
  responseUri: string | null
  responseHash: string | null
  createdAt: number
}

// === Validation ===

export interface Validation {
  id: string
  validatorAddress: string
  requestUri: string | null
  requestHash: string
  response: number | null // 0-100, null if pending
  responseUri: string | null
  responseHash: string | null
  tag: string | null
  status: "PENDING" | "COMPLETED" | "EXPIRED"
  createdAt: number
  updatedAt: number
}

// === Endpoint (derived from AgentRegistrationFile) ===

export interface EndpointDefinition {
  url: string
  protocol: string
  description?: string
}
