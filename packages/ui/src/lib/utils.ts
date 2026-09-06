export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Cached per locale — constructing an Intl formatter is expensive relative to
 * formatting with one, and lists render hundreds of timestamps.
 */
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>()

function relativeFormatter(locale?: string): Intl.RelativeTimeFormat {
  const key = locale ?? ""
  let formatter = relativeFormatters.get(key)
  if (!formatter) {
    // `numeric: "always"` deliberately, not "auto": "auto" renders -1 day as
    // "yesterday" and -1 hour as "this hour", which reads oddly in a dense
    // list of on-chain events and would change every existing rendering.
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "always" })
    relativeFormatters.set(key, formatter)
  }
  return formatter
}

/**
 * Unix seconds → "3 days ago".
 *
 * Uses Intl so the string follows the viewer's locale rather than being
 * hardcoded English. Output for `en` is identical to the hand-rolled version
 * this replaced, down to the pluralisation.
 *
 * @param locale Overrides the runtime default. Mainly for tests — leaving it
 *   undefined is what you want in a component.
 */
export function formatRelativeTime(timestamp: number, locale?: string): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const fmt = relativeFormatter(locale)

  if (days > 0) return fmt.format(-days, "day")
  if (hours > 0) return fmt.format(-hours, "hour")
  if (minutes > 0) return fmt.format(-minutes, "minute")

  // Sub-minute stays a fixed phrase: Intl would render "0 seconds ago".
  return "just now"
}
