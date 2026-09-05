import { Link } from "@tanstack/react-router"
import { NAV } from "./nav"

/**
 * The docs tree, rendered as links. Shared by the `lg`-and-up sidebar in
 * `src/routes/docs.tsx` and the mobile drawer in `src/components/Nav.tsx`,
 * which is the only route to these pages below `lg`.
 *
 * `Link`'s props are generic over the route tree, so the two shapes — a
 * `$slug` route with params, and a plain route — are written out rather than
 * funnelled through one wrapper component.
 */
export function DocsNavLinks({
  linkClassName,
  groupClassName,
  titleClassName,
}: {
  linkClassName: string
  groupClassName: string
  titleClassName: string
}) {
  const activeProps = {
    className: "bg-black/10 dark:bg-white/15 font-medium",
  }

  return (
    <>
      {NAV.map((group, i) => (
        <div key={i} className={groupClassName}>
          {group.title && <span className={titleClassName}>{group.title}</span>}
          {group.items.map((item) =>
            "slug" in item ? (
              <Link
                key={item.slug}
                to={item.to}
                params={{ slug: item.slug }}
                className={linkClassName}
                activeProps={activeProps}
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: true }}
                className={linkClassName}
                activeProps={activeProps}
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      ))}
    </>
  )
}
