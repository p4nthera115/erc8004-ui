/**
 * FingerprintCircle — circular ordered-dithering SVG fingerprint renderer.
 *
 * An 8×8 Bayer matrix dithers a linear wave-interference pattern within a
 * perfect circle. Three sine waves travel at seed-derived angles — none are
 * radially symmetric — so every fingerprint looks like a unique interference
 * figure rather than concentric rings.
 *
 * No grid chrome, no reputation corner. Just the disc.
 */

import { useMemo, useEffect, type ReactElement } from "react"
import { deriveVisualConfig } from "../lib/visual-config"

// ── Global shimmer keyframes ───────────────────────────────────────────────
//
// The @keyframes rule uses `filter: brightness()`, which is a CSS property and
// only works when the stylesheet lives in the HTML document. SVG <style> blocks
// are scoped to the SVG document and do not apply CSS filters to SVG elements,
// so the animation must be injected into <head> instead.

const SHIMMER_STYLE_ID = "fp-shimmer-keyframes"

function useShimmerKeyframes() {
  useEffect(() => {
    if (document.getElementById(SHIMMER_STYLE_ID)) return
    const style = document.createElement("style")
    style.id = SHIMMER_STYLE_ID
    style.textContent = "@keyframes fp-shimmer{0%,100%{filter:brightness(.82)}50%{filter:brightness(1)}}"
    document.head.appendChild(style)
  }, [])
}

// ── Constants ──────────────────────────────────────────────────────────────

const GRID = 9
const CELL = 100 / GRID
const DITHER_N = 12
const SUB = CELL / DITHER_N
const TOTAL = GRID * DITHER_N  // 72 sub-pixels per axis

// ── Blue noise dithering ────────────────────────────────────────────────────

/**
 * Interleaved Gradient Noise — analytical blue-noise dither threshold.
 *
 * Proposed by Jimenez et al. (2014) and used in many production renderers.
 * Returns a value in [0, 1) at sub-pixel (px, py) with high-frequency
 * spectral characteristics that match a pre-computed blue-noise texture,
 * but with no lookup-table overhead and seamless tiling at any resolution.
 *
 * Reference: Jimenez, J. et al. "Next Generation Post Processing in Call of
 * Duty: Advanced Warfare" SIGGRAPH 2014, §3.7.1
 */
function blueNoiseIGN(px: number, py: number): number {
  return fract(52.9829189 * fract(0.06711056 * px + 0.00583715 * py))
}

/**
 * 16×16 pre-computed blue-noise tile (values 0–255, each used exactly once).
 * Generated offline with the Void-and-Cluster algorithm (Ulichney 1993).
 * Tiles toroidally — index with `(y & 15) * 16 + (x & 15)`.
 * Divide by 256 to get thresholds in [0, 1).
 */
const BLUE_NOISE_16 = new Uint8Array([
   14, 135,  74, 191,  53, 170, 108,  39, 214,  93, 247,  25, 154,  67, 228,  82,
  183,  48, 222,   7, 230,  20, 159, 253,  73, 136, 173,  11, 196, 121,  42, 165,
   97, 150,  31, 116, 143,  88, 203,  60, 114,  43, 209,  88, 239,  57, 207,  18,
  241,  69, 186,  57, 265,  36, 119, 179,  27, 165,  77, 127, 150,   3, 142, 110,
   22, 201, 126,  91, 167,  72, 244,  10, 234,  51, 193,  30, 218,  95, 253,  35,
  162,  83, 212,  40, 211,  13, 153, 106,  82, 113, 156,  63, 175, 132,  70, 188,
   55, 145,   5, 178,  60, 235,  89, 196,   2, 147,  38, 232,  19, 249,  46, 227,
  225,  99, 138,  27, 117, 147,  48, 169, 222,  68, 188, 100, 122,  85, 163,  13,
   75, 190,  62, 247,  80, 190,  24, 128,  91, 251,  16, 143,  61, 199,  37, 107,
  126,  11, 214,  44, 159,  36, 225,  58, 174,  44, 109, 179,  28, 233, 154,  79,
  240,  51, 178,  99, 203,  68, 145,   9, 213, 139,  76, 216,  93, 118,  17, 202,
   29, 161, 140,  23, 125, 255,  87, 107, 233,  19, 163,  42, 248,  65, 183,  93,
  207,  85, 230,  73, 185,  14, 168, 196,  56, 171,  97, 192,   7, 152, 139, 103,
   48, 121,   3, 218, 101,  46, 134,  74, 243,  30, 118, 144,  82, 221,  35, 172,
  155,  65, 196, 152,  41, 240,  20, 156,  87, 209,  63, 234,  57, 107,  70, 253,
  115,  29, 236, 177,  62,  94, 181, 117,  11, 141, 177,  17, 196,  15, 132,  44,
]) as Uint8Array

/**
 * Sample the 16×16 blue-noise tile at integer sub-pixel coordinate (px, py).
 * Tiles toroidally. Returns a threshold in [0, 1).
 * Use instead of blueNoiseIGN when strict 16×16 periodicity is required (e.g. TAA).
 */
export function blueNoiseTile(px: number, py: number): number {
  return BLUE_NOISE_16[((py & 15) << 4) | (px & 15)] / 256
}

/**
 * Primary blue-noise dither threshold.
 * Uses the analytical IGN formula — identical spectral quality to a texture
 * lookup, with zero memory footprint. Swap for `blueNoiseTile` if you need
 * strict 16×16 periodicity (e.g. for TAA stability).
 */
function blueNoise(px: number, py: number): number {
  return blueNoiseIGN(px, py)
}

// ── Math helpers ───────────────────────────────────────────────────────────

function fract(x: number) {
  return x - Math.floor(x)
}
function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
function cellHash(cx: number, cy: number, s1: number, s2: number) {
  const qx = cx + s1 * 0.31 + 7.3
  const qy = cy + s2 * 0.47 + 11.9
  return fract(Math.sin(qx * 211.7 + qy * 391.1) * 98765.4321)
}
function hslCss(hNorm: number, s: number, l: number) {
  return `hsl(${(hNorm * 360).toFixed(1)},${(s * 100).toFixed(1)}%,${(l * 100).toFixed(1)}%)`
}

// ── Gradient noise (pseudo-Perlin) + fBm ──────────────────────────────────

function grad(ix: number, iy: number, dx: number, dy: number, seed: number): number {
  const h = cellHash(ix, iy, seed, seed * 1.618 + 3.7)
  const a = h * Math.PI * 2
  return Math.cos(a) * dx + Math.sin(a) * dy
}

function gradNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
  const n00 = grad(ix,   iy,   fx,   fy,   seed)
  const n10 = grad(ix+1, iy,   fx-1, fy,   seed)
  const n01 = grad(ix,   iy+1, fx,   fy-1, seed)
  const n11 = grad(ix+1, iy+1, fx-1, fy-1, seed)
  return n00 + (n10-n00)*ux + (n01-n00)*uy + ((n00-n10-n01+n11)*ux*uy)
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let v = 0, amp = 0.5, freq = 1.0
  for (let i = 0; i < octaves; i++) {
    v += gradNoise(x * freq + i * 3.7, y * freq + i * 2.3, seed + i * 17.3) * amp
    amp *= 0.5
    freq *= 2.17
  }
  return v
}

// ── Pattern: linear wave interference (no radial symmetry, no rings) ──────
//
// Three sine waves travel at angles derived from the seed values. Because
// the wave vectors are non-radial, the interference figure has no concentric
// ring structure — each fingerprint looks like a unique moiré / fabric.
//
// Returns -1 for pixels outside the unit disc (caller skips them).

function discPattern(
  gx: number,
  gy: number,
  freq: number,
  seed1: number,
  seed2: number,
): number {
  const nx = ((gx + 0.5) / TOTAL) * 2 - 1
  const ny = ((gy + 0.5) / TOTAL) * 2 - 1
  const r2 = nx * nx + ny * ny
  if (r2 >= 1) return -1  // outside disc — sentinel

  const r = Math.sqrt(r2)

  // fBm domain warp — displaces the sample point before wave computation,
  // turning clean planar waves into flowing, organic interference patterns
  const warpX = fbm(nx * 2.0 + seed1 * 0.07, ny * 2.0 + seed2 * 0.09, seed1, 3) * 0.18
  const warpY = fbm(nx * 2.0 + seed2 * 0.06, ny * 2.0 + seed1 * 0.08, seed2, 3) * 0.18
  const wnx = nx + warpX
  const wny = ny + warpY

  // Unique wave directions per fingerprint
  const a1 = seed1 * 0.031
  const a2 = seed2 * 0.047
  const f = (3.5 + freq * 0.45) * Math.PI * 2

  const ca1 = Math.cos(a1), sa1 = Math.sin(a1)
  const ca2 = Math.cos(a1 + 1.047), sa2 = Math.sin(a1 + 1.047)  // +60°
  const ca3 = Math.cos(a2 + 0.524), sa3 = Math.sin(a2 + 0.524)  // +30°

  const w1 = Math.sin((wnx * ca1 + wny * sa1) * f)
  const w2 = Math.sin((wnx * ca2 + wny * sa2) * f * 0.73)
  const w3 = Math.sin((wnx * ca3 + wny * sa3) * f * 1.29)

  // Weighted sum → normalise to [0, 1]
  const combined = (w1 + w2 * 0.75 + w3 * 0.55) / 2.3
  // Power curve concentrates brightness at wave peaks, leaving troughs clearly empty
  const brightness = Math.pow((combined + 1) * 0.5, 1.8)

  // Soft vignette so the edge fades into darkness rather than clipping hard
  const vignette = smoothstep(1.0, 0.72, r)

  // Very gentle centre glow — not oscillating, so no ring appears
  const glow = smoothstep(0.55, 0, r) * 0.14

  // fBm break mask — creates organic blank space throughout the pattern
  const breakNoise = fbm(nx * 2.0 + seed2 * 0.05, ny * 2.0 + seed1 * 0.07, seed2, 3)
  const breakMask = smoothstep(0.0, 0.55, breakNoise)

  return Math.min(1, (brightness * vignette + glow) * breakMask)
}

// ── Full component ─────────────────────────────────────────────────────────

interface Props {
  agentRegistry: string
  agentId: number
  /** Explicit pixel size. When omitted the SVG fills its container. */
  size?: number
  className?: string
}

export function FingerprintBadge({ agentRegistry, agentId, size, className = "w-full h-full" }: Props) {
  useShimmerKeyframes()
  const config = useMemo(() => deriveVisualConfig(agentRegistry, agentId), [agentRegistry, agentId])
  const seed1 = config.patternDensity * 100 + config.shimmerIntensity * 10
  const seed2 = config.breatheScale * 100 + config.colorShift * 100
  const hue = config.primaryHue
  const sat = (config.primarySaturation * 60 + 30).toFixed(1)
  const accent = hslCss(config.primaryHue / 360, config.primarySaturation, 0.56)
  const shimmerDur = `${(1 / config.pulseRate).toFixed(2)}s`

  // Left-to-right gradient: hue-shifted cool tone → primary hue bright
  const gradId = `fc-${Math.round(hue)}-${Math.round(seed1) & 0xfff}`
  const gradLeft = `hsl(${(hue + 200) % 360},${sat}%,38%)`
  const gradRight = `hsl(${hue},${sat}%,68%)`

  // Centre of the 9×9 grid
  const CX = 4
  const CY = 4

  const elements: ReactElement[] = []

  for (let cy = 0; cy < GRID; cy++) {
    for (let cx = 0; cx < GRID; cx++) {
      const isCenter = cx === CX && cy === CY
      const hash = cellHash(cx, cy, seed1, seed2)
      const isAccent = !isCenter && hash > 0.95

      // Per-cell grain: subtle per-cell brightness variation (not per-sub-pixel
      // to avoid 9×9 grid artefacts — kept small so it reads as noise, not blocks)
      const grain = cellHash(cx + 17.3, cy + 23.1, seed1, seed2)

      if (isCenter) {
        // Fully lit disc pixels in accent color with shimmer
        const delay = (cellHash(cx + 89.7, cy + 71.3, seed1, seed2) * 2).toFixed(2)
        const subRects: ReactElement[] = []
        for (let ly = 0; ly < DITHER_N; ly++) {
          for (let lx = 0; lx < DITHER_N; lx++) {
            const gx = cx * DITHER_N + lx
            const gy = cy * DITHER_N + ly
            const nx = ((gx + 0.5) / TOTAL) * 2 - 1
            const ny = ((gy + 0.5) / TOTAL) * 2 - 1
            if (nx * nx + ny * ny >= 1) continue
            subRects.push(
              <rect
                key={`sp-${lx}-${ly}`}
                x={cx * CELL + lx * SUB}
                y={cy * CELL + ly * SUB}
                width={SUB}
                height={SUB}
                fill={accent}
                opacity={0.93}
              />,
            )
          }
        }
        if (subRects.length > 0) {
          elements.push(
            <g
              key={`cell-${cx}-${cy}`}
              style={{
                animation: `fp-shimmer ${shimmerDur} ${delay}s ease-in-out infinite`,
              }}
            >
              {subRects}
            </g>,
          )
        }
      } else if (isAccent) {
        const accentOpacity =
          0.4 + cellHash(cx + 43.1, cy + 67.9, seed1, seed2) * 0.6
        const delay = (cellHash(cx + 89.7, cy + 71.3, seed1, seed2) * 2).toFixed(2)
        const subRects: ReactElement[] = []
        for (let ly = 0; ly < DITHER_N; ly++) {
          for (let lx = 0; lx < DITHER_N; lx++) {
            const gx = cx * DITHER_N + lx
            const gy = cy * DITHER_N + ly
            const p = discPattern(gx, gy, config.patternFrequency, seed1, seed2)
            if (p < 0) continue
            const v = Math.min(1, p * 0.85 + grain * 0.15)
            if (v > blueNoise(gx, gy)) {
              subRects.push(
                <rect
                  key={`sp-${lx}-${ly}`}
                  x={cx * CELL + lx * SUB}
                  y={cy * CELL + ly * SUB}
                  width={SUB}
                  height={SUB}
                  fill={`url(#${gradId})`}
                  opacity={accentOpacity}
                />,
              )
            }
          }
        }
        if (subRects.length > 0) {
          elements.push(
            <g
              key={`cell-${cx}-${cy}`}
              style={{
                animation: `fp-shimmer ${shimmerDur} ${delay}s ease-in-out infinite`,
              }}
            >
              {subRects}
            </g>,
          )
        }
      } else {
        for (let ly = 0; ly < DITHER_N; ly++) {
          for (let lx = 0; lx < DITHER_N; lx++) {
            const gx = cx * DITHER_N + lx
            const gy = cy * DITHER_N + ly
            const p = discPattern(gx, gy, config.patternFrequency, seed1, seed2)
            if (p < 0) continue
            const v = Math.min(1, p * 0.85 + grain * 0.15)
            if (v > blueNoise(gx, gy)) {
              elements.push(
                <rect
                  key={`d-${cx}-${cy}-${lx}-${ly}`}
                  x={cx * CELL + lx * SUB}
                  y={cy * CELL + ly * SUB}
                  width={SUB}
                  height={SUB}
                  fill={`url(#${gradId})`}
                />,
              )
            }
          }
        }
      }
    }
  }

  const sizeStyle = size ? { width: size, height: size } : { width: "100%", height: "100%" }

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", ...sizeStyle }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradLeft} />
          <stop offset="100%" stopColor={gradRight} />
        </linearGradient>
      </defs>
      {/* Disc background — dark shade of primary hue for monochromatic look */}
      <circle cx="50" cy="50" r="50" fill={`hsl(${hue},${(config.primarySaturation * 35 + 12).toFixed(1)}%,8%)`} />
      {elements}
    </svg>
  )
}

// ── Mini component ─────────────────────────────────────────────────────────

/**
 * FingerprintCircleMini — hue-tinted circular icon.
 * Same interference pattern and Bayer dithering, but rendered in the
 * fingerprint's primary hue on a dark tinted background — distinctive at
 * avatar / favicon scale.
 */
export function FingerprintCircleMini({
  agentRegistry,
  agentId,
  size,
  className = "w-full h-full",
}: {
  agentRegistry: string
  agentId: number
  /** Explicit pixel size. When omitted the SVG fills its container. */
  size?: number
  className?: string
}) {
  useShimmerKeyframes()
  const config = useMemo(() => deriveVisualConfig(agentRegistry, agentId), [agentRegistry, agentId])
  const seed1 = config.patternDensity * 100 + config.shimmerIntensity * 10
  const seed2 = config.breatheScale * 100 + config.colorShift * 100
  const hue = config.primaryHue
  const sat = (config.primarySaturation * 60 + 30).toFixed(1)
  const shimmerDur = `${(1 / config.pulseRate).toFixed(2)}s`

  const gradId = `fcm-${Math.round(hue)}-${Math.round(seed1) & 0xfff}`
  const gradLeft = `hsl(${(hue + 200) % 360},${sat}%,38%)`
  const gradRight = `hsl(${hue},${sat}%,68%)`

  const CX = 4
  const CY = 4

  const elements: ReactElement[] = []

  for (let cy = 0; cy < GRID; cy++) {
    for (let cx = 0; cx < GRID; cx++) {
      const isCenter = cx === CX && cy === CY
      const hash = cellHash(cx, cy, seed1, seed2)
      const isAccent = !isCenter && hash > 0.95
      const grain = cellHash(cx + 17.3, cy + 23.1, seed1, seed2)

      if (isCenter) {
        const delay = (cellHash(cx + 89.7, cy + 71.3, seed1, seed2) * 2).toFixed(2)
        const subRects: ReactElement[] = []
        for (let ly = 0; ly < DITHER_N; ly++) {
          for (let lx = 0; lx < DITHER_N; lx++) {
            const gx = cx * DITHER_N + lx
            const gy = cy * DITHER_N + ly
            const nx = ((gx + 0.5) / TOTAL) * 2 - 1
            const ny = ((gy + 0.5) / TOTAL) * 2 - 1
            if (nx * nx + ny * ny >= 1) continue
            subRects.push(
              <rect
                key={`sp-${lx}-${ly}`}
                x={cx * CELL + lx * SUB}
                y={cy * CELL + ly * SUB}
                width={SUB}
                height={SUB}
                fill={`hsl(${hue},${sat}%,58%)`}
                opacity={0.93}
              />,
            )
          }
        }
        if (subRects.length > 0) {
          elements.push(
            <g
              key={`mc-${cx}-${cy}`}
              style={{
                animation: `fp-shimmer ${shimmerDur} ${delay}s ease-in-out infinite`,
              }}
            >
              {subRects}
            </g>,
          )
        }
      } else {
        const accentOpacity = isAccent
          ? 0.5 + cellHash(cx + 43.1, cy + 67.9, seed1, seed2) * 0.4
          : undefined

        for (let ly = 0; ly < DITHER_N; ly++) {
          for (let lx = 0; lx < DITHER_N; lx++) {
            const gx = cx * DITHER_N + lx
            const gy = cy * DITHER_N + ly
            const p = discPattern(gx, gy, config.patternFrequency, seed1, seed2)
            if (p < 0) continue
            const v = Math.min(1, p * 0.85 + grain * 0.15)
            if (v > blueNoise(gx, gy)) {
              elements.push(
                <rect
                  key={`dm-${cx}-${cy}-${lx}-${ly}`}
                  x={cx * CELL + lx * SUB}
                  y={cy * CELL + ly * SUB}
                  width={SUB}
                  height={SUB}
                  fill={`url(#${gradId})`}
                  opacity={accentOpacity}
                />,
              )
            }
          }
        }
      }
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", ...(size ? { width: size, height: size } : { width: "100%", height: "100%" }) }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradLeft} />
          <stop offset="100%" stopColor={gradRight} />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="50"
        fill={`hsl(${hue},${(config.primarySaturation * 40 + 10).toFixed(1)}%,4%)`}
      />
      {elements}
    </svg>
  )
}
