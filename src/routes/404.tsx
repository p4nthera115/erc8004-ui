import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/404")({
  component: NotFound,
})

function NotFound() {
  return (
    <main className="max-w-2xl mx-auto py-24 px-6 font-mono">
      <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
        404 — Page not found
      </h1>
      <p className="mb-8 text-neutral-600 dark:text-white/60 leading-relaxed">
        That page doesn&apos;t exist. The agent-readable index is at{" "}
        <a className="underline" href="/llms.txt">
          /llms.txt
        </a>
        .
      </p>
      <Link
        to="/docs/introduction"
        className="underline text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white"
      >
        Back to documentation →
      </Link>
    </main>
  )
}
