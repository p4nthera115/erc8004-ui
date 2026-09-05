/**
 * Accept-header parsing for the /api handlers.
 *
 * A deliberate copy of the two functions in `src/server/negotiation.ts` rather
 * than an import of them. The functions under /api are traced and compiled by
 * Vercel one file at a time; reaching outside the directory for a module that
 * itself imports the generated route manifest and the site content would pull
 * the front end's module graph into every serverless function. The pair is
 * small and pure, and `tests/api.test.ts` asserts the two copies decide every
 * case identically, so they cannot drift in behaviour.
 */

type MediaRange = { type: string; q: number }

function parseAccept(header: string | null | undefined): MediaRange[] {
  if (!header) return []
  return header
    .split(",")
    .map((part) => {
      const [type, ...parameters] = part.trim().split(";")
      const qParameter = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="))
      const q = qParameter ? Number.parseFloat(qParameter.slice(2)) : 1
      return {
        type: type.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 1,
      }
    })
    .filter((range) => range.type !== "")
}

/**
 * Whether the caller will accept `mediaType` at all. RFC 9110 §12.5.1: the
 * most specific matching media range decides, so `application/json;q=0, *\/*`
 * rejects JSON even though the wildcard would have allowed it.
 */
export function acceptsType(
  accept: string | null | undefined,
  mediaType: string
): boolean {
  const ranges = parseAccept(accept)
  if (ranges.length === 0) return true

  const [group] = mediaType.split("/")
  let bestSpecificity = -1
  let q = 0
  for (const range of ranges) {
    const specificity =
      range.type === mediaType
        ? 2
        : range.type === `${group}/*`
          ? 1
          : range.type === "*/*"
            ? 0
            : -1
    if (specificity > bestSpecificity) {
      bestSpecificity = specificity
      q = range.q
    }
  }
  return bestSpecificity >= 0 && q > 0
}

/**
 * True when none of the representations this endpoint can produce is
 * acceptable — the only case where 406 is the right answer. A missing header
 * or a bare wildcard means "no constraint", never "nothing works".
 */
export function isNotAcceptable(
  accept: string | null | undefined,
  offered: readonly string[]
): boolean {
  if (!accept || accept.trim() === "") return false
  return !offered.some((mediaType) => acceptsType(accept, mediaType))
}
