export interface SharedProps {
  agentRegistry: `0x${string}`;
  agentId: bigint;
  className?: string;
}

export interface RegistrationFile {
  name: string;
  version: string;
  description?: string;
  endpoints?: EndpointDefinition[];
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface EndpointDefinition {
  url: string;
  protocol: string;
  description?: string;
}

export interface FeedbackEntry {
  id: string;
  reviewer: `0x${string}`;
  agentRegistry: `0x${string}`;
  agentId: bigint;
  score: number;
  comment?: string;
  timestamp: number;
  transactionHash: `0x${string}`;
}

export interface ReputationSummary {
  agentRegistry: `0x${string}`;
  agentId: bigint;
  totalFeedback: number;
  averageScore: number;
  scoreDistribution: Record<number, number>;
  recentFeedback: FeedbackEntry[];
}

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  agentRegistry: `0x${string}`;
  agentId: bigint;
  actor?: `0x${string}`;
  data?: Record<string, unknown>;
  timestamp: number;
  blockNumber: number;
  transactionHash: `0x${string}`;
}

export type ActivityEventType =
  | 'registered'
  | 'updated'
  | 'feedback_submitted'
  | 'endpoint_called'
  | 'deregistered';
