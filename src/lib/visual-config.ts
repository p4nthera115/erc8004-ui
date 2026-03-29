import type { VisualConfig, GeometryClass, PatternType, BorderStyle } from './types'

// ── Deterministic field derivation ────────────────────────────────────────
//
// Every VisualConfig field is derived from a single numeric seed so the
// fingerprint is stable and reproducible from the identifier alone.

function fract(x: number): number {
  return x - Math.floor(x)
}

/** Derive sub-field n from a base seed in [0, 1). */
function h(seed: number, n: number): number {
  return fract(Math.sin(seed * 127.1 + n * 311.7) * 43758.5453)
}

/**
 * Converts agentRegistry + agentId into a deterministic VisualConfig.
 * Uses FNV-1a to hash the combined identifier string to a numeric seed,
 * then derives each field independently so no two agents share the same
 * visual fingerprint.
 */
export function deriveVisualConfig(
  agentRegistry: string,
  agentId: number,
): VisualConfig {
  const key = `${agentRegistry.toLowerCase()}-${agentId.toString()}`

  // FNV-1a 32-bit hash → normalised float seed
  let n = 2166136261
  for (let i = 0; i < key.length; i++) {
    n ^= key.charCodeAt(i)
    n = Math.imul(n, 16777619) >>> 0
  }
  const seed = n / 0x100000000

  const geometries: GeometryClass[] = [
    'sphere', 'torus', 'icosahedron', 'octahedron',
    'torusKnot', 'dodecahedron', 'tetrahedron', 'cone',
  ]
  const patterns: PatternType[] = [
    'voronoi', 'noise', 'rings', 'grid',
    'hexagonal', 'spiral', 'stripes', 'dots',
  ]
  const borders: BorderStyle[] = ['none', 'thin', 'thick', 'glow']

  const primaryHue = h(seed, 0) * 360
  // Secondary hue is offset by 120°–240° so it contrasts visually
  const secondaryHue = (primaryHue + 120 + h(seed, 3) * 120) % 360

  return {
    primaryHue,
    primarySaturation:     0.4 + h(seed,  1) * 0.6,
    primaryLightness:      0.35 + h(seed, 2) * 0.3,
    secondaryHue,
    secondaryLightness:    0.3 + h(seed,  4) * 0.4,
    geometryClass:         geometries[Math.floor(h(seed,  5) * geometries.length)],
    patternType:           patterns[Math.floor(h(seed,    6) * patterns.length)],
    patternFrequency:      1 + h(seed,  7) * 15,
    patternDensity:        0.3 + h(seed, 8) * 0.7,
    borderStyle:           borders[Math.floor(h(seed,     9) * borders.length)],
    borderWidth:           h(seed, 10),
    rotationSpeed:         (h(seed, 11) * 2 - 1) * 0.8,
    rotationAxis:          [h(seed, 12), h(seed, 13), h(seed, 14)],
    particleDensity:       h(seed, 15),
    displacementAmplitude: h(seed, 16),
    displacementFrequency: 1 + h(seed, 17) * 7,
    pulseRate:             0.1 + h(seed, 18) * 0.9,
    shimmerIntensity:      h(seed, 19),
    colorShift:            h(seed, 20),
    breatheScale:          h(seed, 21),
    reputationScore:       0,
  }
}
