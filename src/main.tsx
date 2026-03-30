import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import "./index.css"
import { ERC8004Provider } from "./provider/ERC8004Provider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — on-chain data changes rarely
      gcTime: 1000 * 60 * 30, // 30 min in-memory cache
      retry: 2,
    },
  },
})

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ERC8004Provider apiKey={import.meta.env.VITE_GRAPH_API_KEY}>
        <RouterProvider router={router} />
      </ERC8004Provider>
    </QueryClientProvider>
  </StrictMode>
)
