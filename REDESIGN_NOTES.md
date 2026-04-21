# Redesign Audit Notes

Visual audit of every component before the polish pass. Each entry lists current issues and planned changes.

---

## Internal Primitives (to build)

None exist yet. Will create `src/components/_internal/` with: Card, Stat, Tag, Address, Skeleton, EmptyState, ErrorState.

---

## Identity Components

### AgentName
- **Issues:** No `font-medium`. Falls back to `Agent #{id}` string instead of using `<Address>` primitive for truncated form. Error state shows raw red text with no fallback styling.
- **Plan:** Add `font-medium`. Error fallback → `<Address>` truncated form. Use `<Skeleton>` for loading.

### AgentImage
- **Issues:** Uses `rounded-full` — brief says `rounded-erc8004-md`. No `border border-erc8004-border`. Loading skeleton is `rounded-full` too.
- **Plan:** Change to `rounded-erc8004-md` with `border border-erc8004-border object-cover`. Use `<Skeleton>` primitive for loading.

### AgentDescription
- **Issues:** Missing `leading-relaxed`. No loading/error/empty primitives.
- **Plan:** Add `leading-relaxed`. Use `<Skeleton>` for loading. Keep null return for empty (it's an atomic text component).

### AgentCard
- **Issues:** Uses `rounded-erc8004-xl` — should be `rounded-erc8004-lg`. Avatar uses `rounded-full` — should match AgentImage (`rounded-erc8004-md`). Title uses `font-semibold` — brief says `font-medium`. Description has `mt-1` — tight. Tag pills use `rounded-full` — brief says `rounded-erc8004-sm`. No dot separator between address and protocol tags. No `shadow-sm`. Padding is `p-5` — brief says `p-6`.
- **Plan:** Full restructure per brief. Use `<Card shadow>`, `<Address>`, `<Tag>`, `<Skeleton>`, `<EmptyState>`, `<ErrorState>` primitives. Two-row layout with dot separator.

### EndpointStatus
- **Issues:** Uses `rounded-erc8004-xl` — should be `rounded-erc8004-lg`. Protocol badges use `rounded-full` — should use `<Tag variant="accent">`. Title uses `font-semibold` — brief says `font-medium`. No health status dot colours per brief.
- **Plan:** Use `<Card>`, `<Tag>`, `<EmptyState>`, `<ErrorState>`. Protocol labels as `<Tag variant="accent">`. URL in `font-mono text-xs`. Status dots per brief spec.

### IdentityDisplay
- **Issues:** Uses `rounded-erc8004-xl`. Title `font-semibold`. Same tag/radius issues as AgentCard. Duplicates logic from AgentCard + EndpointStatus.
- **Plan:** Use `<Card>`, `<Address>`, `<Tag>`. Match AgentCard + EndpointStatus redesign. Use primitives throughout.

---

## Reputation Components

### ReputationScore
- **Issues:** Currently an inline badge with a small dot + mono score. Count is hidden behind `opacity-0 group-hover:opacity-100` — too clever, should always show. Uses `text-xl` — brief says `text-2xl font-semibold tabular-nums`. No "AVG" label. Uses `scoreColor` with threshold 7 — feedback `value` has no fixed scale.
- **Plan:** Horizontal `<Stat>` layout per brief. Big number left, "AVG" + count right. Always-visible count. Remove hover-to-show pattern. Remove threshold-based "Highly Rated" tag (scale unknown). Use `<Skeleton>` for loading.

### ReputationDistribution
- **Issues:** Uses `rounded-erc8004-xl`. Title uses `font-semibold`. Multi-colored bars (5 different colors) — brief says `bg-erc8004-accent` for filled, `bg-erc8004-muted` for empty. Error state uses raw error styling instead of `<ErrorState>`.
- **Plan:** Use `<Card>`, `<ErrorState>`, `<EmptyState>`. Simplify bar colors to `bg-erc8004-accent` for all filled bars. Empty buckets show 4px `bg-erc8004-muted` stub. Keep both orientations.

### ReputationTimeline
- **Issues:** Full scatter plot with axes, tooltips, colored dots — brief says "sparkline only, single stroke, no axes, no labels, no tooltips". Uses `rounded-erc8004-xl`. Title `font-semibold`.
- **Plan:** Dramatic simplification to sparkline. Single 1.5px stroke in `--erc8004-chart-1`. No dots, no gridlines, no axis labels, no tooltips. Wrap in `<Card>` with small header. Keep `range` and `showTrendLine` props (they still make sense). Remove `showDataPoints` as there are no dots in a sparkline.

### FeedbackList
- **Issues:** Uses `rounded-erc8004-xl`. Nested `FeedbackCard` has its own `rounded-erc8004-lg border` — should be flat divide-y rows per brief. Tag pills use `rounded-full`. Response border uses `border-l-2` — brief says 1px only.
- **Plan:** Use `<Card>` wrapper. Replace card-per-row with `divide-y divide-erc8004-border` rows. Each row: small score, `<Tag>`s, `<Address>`, timestamp on right. Review text below. Responses with `pl-4 border-l border-erc8004-border`. "Load more" button instead of prev/next. Use `<ErrorState>`, `<EmptyState>`.

### TagCloud
- **Issues:** Uses `rounded-erc8004-xl`. Title `font-semibold`. Tag pills use `rounded-full` — brief says `rounded-erc8004-sm`. Loading skeletons use `rounded-full`.
- **Plan:** Use `<Card>`, `<Tag>` primitive (which uses `rounded-erc8004-sm`). Three tiers via `text-sm`/`text-xs`/`text-xs opacity-70`. Use `<EmptyState>`, `<ErrorState>`.

---

## Validation Components

### VerificationBadge
- **Issues:** Current tiers use thresholds (score≥80 + count≥5, score≥60 + count≥3). Brief says (count≥1 + score≥70, count≥5 + score≥85). Dot is `h-2 w-2` — fine. Uses `div` for dot — should be consistent. "Partially Verified" tier not in brief — brief has Unverified/Verified/Highly Verified only.
- **Plan:** Update thresholds per brief. Use `<Tag>` primitive with variant props. Three tiers: Unverified (hollow dot, muted), Verified (filled dot, positive), Highly Verified (filled dot + count, positive). Use `<Skeleton>`.

### ValidationScore
- **Issues:** Uses `rounded-erc8004-xl`. Title `font-semibold`. Score uses `text-4xl` — brief says `text-3xl`. Fill bar has dynamic color per score — brief says always `bg-erc8004-positive`. `transition-all` — brief says 200ms ease-out width transition only.
- **Plan:** Use `<Card>`. Horizontal layout per brief. Score `text-3xl font-semibold tabular-nums` with `/100` suffix. Fill bar always `bg-erc8004-positive` with `transition-[width] duration-200 ease-out`. Count line below bar. Use `<ErrorState>`, `<EmptyState>`.

### ValidationList
- **Issues:** Uses `rounded-erc8004-xl`. Nested cards per row — should be divide-y flat rows. Status badges use `rounded-full`. Same pagination as FeedbackList (prev/next).
- **Plan:** Use `<Card>` wrapper. Flat divide-y rows. Each row: status dot (positive/muted/negative), small score, `<Tag>` for tag, `<Address>` for validator, timestamp. "Load more" button. Use `<ErrorState>`, `<EmptyState>`.

### ValidationDisplay
- **Issues:** Renders as stacked separate components with `space-y-4`. Brief says unified single `<Card shadow>` — not three nested cards.
- **Plan:** Single `<Card shadow>` with VerificationBadge inline at top, ValidationScore filling next row, ValidationList below. Render children flat (no nested card borders).

---

## Activity Components

### LastActivity
- **Issues:** Just a span with relative time. No status dot. Uses `text-sm` — brief says `text-xs`. No "recently active" indicator.
- **Plan:** `inline-flex items-center gap-1.5 text-xs text-erc8004-muted-fg` with dot: `bg-erc8004-positive` if within 7 days, `bg-erc8004-muted` otherwise. Use `<Skeleton>`.

### ActivityLog
- **Issues:** Uses `rounded-erc8004-xl`. Event icons use `rounded-full bg-erc8004-muted` circles — brief says dot + connecting line timeline. No day grouping. Title `font-semibold`.
- **Plan:** Use `<Card>`. Timeline layout with left-aligned dots + connecting line (`bg-erc8004-border w-px`). Event type as `<Tag>`. Day grouping with small day-divider. Use `<ErrorState>`, `<EmptyState>`.

---

## Composed Components

### ReputationDisplay
- **Does not exist yet.** Referenced in claude.md build order as #9 (completed) but no file found.
- **Plan:** Build as single `<Card shadow>` containing: ReputationScore inline at top right, ReputationDistribution and ReputationTimeline side-by-side (stack on narrow), FeedbackList at bottom. Children render flat (no nested card borders).

---

## Global Issues

1. **All card components** use `rounded-erc8004-xl` — brief says `rounded-erc8004-lg`.
2. **All headers** use `font-semibold` — brief says `font-medium`.
3. **All tag pills** use `rounded-full` — brief says `rounded-erc8004-sm`.
4. **No components** use the shared primitives (they don't exist yet).
5. **Error states** are all inline with raw error messages — should use `<ErrorState>` with plain language.
6. **Empty states** are inconsistent — should use `<EmptyState>`.
7. **Loading states** are per-component custom — should use `<Skeleton>`.

## Token Gaps

None identified — existing tokens cover all needs in the brief.
