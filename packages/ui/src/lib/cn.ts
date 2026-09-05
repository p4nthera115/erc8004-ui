import { twMerge } from "tailwind-merge"

/**
 * Merges class names with Tailwind conflict resolution.
 * Consumer classes (passed via className prop) override library defaults
 * when they target the same CSS property.
 *
 * Usage inside components:
 *   cn("p-3 bg-erc8004-bg", isActive && "ring-2", className)
 */
export function cn(...inputs: (string | undefined | false | null)[]): string {
  return twMerge(inputs.filter(Boolean).join(" "))
}
