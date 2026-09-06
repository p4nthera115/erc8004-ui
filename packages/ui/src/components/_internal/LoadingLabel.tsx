/**
 * The screen-reader half of a loading state.
 *
 * Skeletons are `aria-hidden` — they carry no content, and a card full of them
 * announcing individually is noise. This renders the one thing worth saying,
 * once, in the branch that is actually loading. Pair it with `busy` on the
 * surrounding Card.
 */
export function LoadingLabel({ label = "Loading…" }: { label?: string }) {
  return (
    <span role="status" className="sr-only">
      {label}
    </span>
  )
}
