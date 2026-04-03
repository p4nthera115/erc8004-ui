import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/introduction')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/Introduction"!</div>
}
