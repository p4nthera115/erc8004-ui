import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/components')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/Components"!</div>
}
