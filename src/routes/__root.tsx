import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Nav } from '../components/Nav'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen grid-bg">
      <Nav />
      <Outlet />
    </div>
  ),
})
