// Components
export { FingerprintBadge, FingerprintCircleMini } from './components/fingerprint/FingerprintBadge'

// Provider
export { ERC8004Provider } from './provider/ERC8004Provider'

// Hooks (public API for custom UIs)
export { useAgent } from './components/agent-card/useAgent'
export { useReputationStats, useFeedbackList } from './components/reputation/useReputation'
export { useActivity } from './components/activity/useActivity'
export { useEndpointStatus } from './components/endpoint/useEndpointStatus'

// Types
export type {
  SharedProps,
  AgentData,
  ReputationData,
  Feedback,
  FeedbackFile,
} from './types'
