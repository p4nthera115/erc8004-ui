import { expect, test } from "vitest"
import { formatRelativeTime } from "../packages/ui/src/lib/utils"

const now = () => Math.floor(Date.now() / 1000)

test("en output is byte-identical to the previous hand-rolled version", () => {
  const cases: Array<[number, string]> = [
    [0, "just now"],
    [30, "just now"],
    [60, "1 minute ago"],
    [120, "2 minutes ago"],
    [3600, "1 hour ago"],
    [7200, "2 hours ago"],
    [86400, "1 day ago"],
    [86400 * 3, "3 days ago"],
    [86400 * 102, "102 days ago"],
  ]
  for (const [ago, expected] of cases) {
    expect(formatRelativeTime(now() - ago, "en"), `${ago}s ago`).toBe(expected)
  }
})

test("other locales are translated rather than hardcoded English", () => {
  expect(formatRelativeTime(now() - 86400 * 3, "fr")).toBe("il y a 3 jours")
  expect(formatRelativeTime(now() - 3600, "de")).toBe("vor 1 Stunde")
})
