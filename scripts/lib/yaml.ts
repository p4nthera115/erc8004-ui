/**
 * Minimal JSON → YAML serialiser.
 *
 * Exists so `/openapi.yaml` can be published alongside `/openapi.json` without
 * adding a dependency for one build-time transform. It handles exactly what an
 * OpenAPI document contains — objects, arrays, strings, numbers, booleans and
 * null — and quotes any string that YAML would otherwise reinterpret.
 */

/** Strings YAML 1.1 readers coerce to booleans or null unless quoted. */
const RESERVED_WORDS = new Set([
  "y", "yes", "n", "no", "true", "false", "on", "off", "null", "~",
])

function needsQuoting(value: string): boolean {
  if (value === "") return true
  if (RESERVED_WORDS.has(value.toLowerCase())) return true
  // Leading indicators, trailing space, or anything that reads as a number.
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(value)) return true
  if (/^\s|\s$/.test(value)) return true
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value)) return true
  if (/:\s/.test(value) || value.includes(": ") || value.endsWith(":")) return true
  if (value.includes(" #")) return true
  return false
}

function quote(value: string): string {
  return JSON.stringify(value)
}

function scalar(
  value: string | number | boolean | null,
  pad = ""
): string {
  if (value === null) return "null"
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null"
  if (typeof value === "boolean") return String(value)
  if (value.includes("\n")) {
    // Block scalar keeps long descriptions readable; `|-` strips the final
    // newline. Continuation lines sit one level deeper than the key.
    const body = pad + "  "
    return `|-\n${value
      .split("\n")
      .map((line) => (line ? `${body}${line}` : ""))
      .join("\n")}`
  }
  return needsQuoting(value) ? quote(value) : value
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
}

function emit(value: unknown, depth: number): string {
  const pad = "  ".repeat(depth)

  if (isScalar(value) || value === undefined) {
    return scalar(value === undefined ? null : value, pad)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    return value
      .map((item) => {
        if (isScalar(item) || item === undefined) {
          return `${pad}- ${emit(item, depth)}`
        }
        // The item was emitted one level deeper, so its lines already carry the
        // right indentation — only the first swaps its padding for the dash.
        const [first, ...rest] = emit(item, depth + 1).split("\n")
        return [`${pad}- ${first.trimStart()}`, ...rest].join("\n")
      })
      .join("\n")
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entry]) => entry !== undefined
  )
  if (entries.length === 0) return "{}"

  return entries
    .map(([key, entry]) => {
      // A bare numeric key (an OpenAPI status code) would parse as an int.
      const bareKey = /^[A-Za-z_][A-Za-z0-9_./{}-]*$/.test(key)
      const safeKey = bareKey ? key : quote(key)
      if (isScalar(entry)) return `${pad}${safeKey}: ${scalar(entry, pad)}`
      if (Array.isArray(entry) && entry.length === 0) return `${pad}${safeKey}: []`
      if (
        !Array.isArray(entry) &&
        Object.keys(entry as Record<string, unknown>).length === 0
      ) {
        return `${pad}${safeKey}: {}`
      }
      return `${pad}${safeKey}:\n${emit(entry, depth + 1)}`
    })
    .join("\n")
}

export function toYaml(value: unknown): string {
  return `${emit(value, 0)}\n`
}
