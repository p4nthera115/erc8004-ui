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

/**
 * Visual config produced by the parameter mapper.
 * This object is renderer-agnostic — it fully describes the fingerprint
 * without any rendering logic.
 */
export interface VisualConfig {
  // Colors
  primaryHue: number        // 0–360
  primarySaturation: number // 0–1
  primaryLightness: number  // 0–1
  secondaryHue: number      // 0–360
  secondaryLightness: number // 0–1

  // Geometry
  geometryClass: GeometryClass

  // Pattern
  patternType: PatternType
  patternFrequency: number  // 1–16
  patternDensity: number    // 0–1

  // Border / outline
  borderStyle: BorderStyle
  borderWidth: number       // 0–1

  // Motion
  rotationSpeed: number     // -1 to 1 (negative = CCW)
  rotationAxis: [number, number, number]

  // Particles
  particleDensity: number   // 0–1

  // Displacement / waveform
  displacementAmplitude: number // 0–1
  displacementFrequency: number // 1–8

  // Animation modifiers
  pulseRate: number         // 0–1
  shimmerIntensity: number  // 0–1
  colorShift: number        // 0–1
  breatheScale: number      // 0–1

  // Reputation score — placeholder until ERC-8004 is connected
  reputationScore: number   // 0–100 (integer)
}

export type GeometryClass =
  | 'sphere'
  | 'torus'
  | 'icosahedron'
  | 'octahedron'
  | 'torusKnot'
  | 'dodecahedron'
  | 'tetrahedron'
  | 'cone'

export type PatternType =
  | 'voronoi'
  | 'noise'
  | 'rings'
  | 'grid'
  | 'hexagonal'
  | 'spiral'
  | 'stripes'
  | 'dots'

export type BorderStyle = 'none' | 'thin' | 'thick' | 'glow'

export type ActivityEventType =
  | 'registered'
  | 'updated'
  | 'feedback_submitted'
  | 'endpoint_called'
  | 'deregistered';
