import type { SetupGuide } from "./types.js";

export const setupGuides: SetupGuide[] = [
  {
    framework: "vite",
    steps: [
      "1. Install Tailwind CSS v4:\n   pnpm add tailwindcss @tailwindcss/vite",
      '2. Add the Tailwind plugin to vite.config.ts:\n   import tailwindcss from "@tailwindcss/vite";\n   export default defineConfig({ plugins: [tailwindcss()] });',
      '3. Import Tailwind in your main CSS file:\n   @import "tailwindcss";',
      "4. Install TanStack Query (required for data caching across components):\n   pnpm add @tanstack/react-query",
      '5. Wrap your app with QueryClientProvider in src/main.tsx:\n   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";\n   const queryClient = new QueryClient({\n     defaultOptions: { queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30, retry: 2 } },\n   });\n   // Wrap <App /> with <QueryClientProvider client={queryClient}>',
      "6. Copy the erc8004 components into your project (e.g., src/components/erc8004/).",
      '7. Import and use:\n   import { FingerprintBadge } from "./components/erc8004/FingerprintBadge";\n   <FingerprintBadge agentRegistry="eip155:1:0x742..." agentId={22} />',
    ],
  },
  {
    framework: "nextjs",
    steps: [
      "1. Install Tailwind CSS v4:\n   pnpm add tailwindcss @tailwindcss/postcss",
      '2. Add Tailwind to postcss.config.mjs:\n   export default { plugins: { "@tailwindcss/postcss": {} } };',
      '3. Import Tailwind in your global CSS:\n   @import "tailwindcss";',
      "4. Install TanStack Query (required for data caching across components):\n   pnpm add @tanstack/react-query",
      '5. Create a client-side provider component (e.g., app/providers.tsx):\n   "use client";\n   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";\n   import { useState } from "react";\n   export function Providers({ children }: { children: React.ReactNode }) {\n     const [queryClient] = useState(() => new QueryClient({\n       defaultOptions: { queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30, retry: 2 } },\n     }));\n     return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;\n   }\n   // Wrap your root layout children with <Providers>',
      "6. Copy the erc8004 components into your project (e.g., components/erc8004/).",
      '7. Import and use:\n   import { FingerprintBadge } from "@/components/erc8004/FingerprintBadge";\n   <FingerprintBadge agentRegistry="eip155:1:0x742..." agentId={22} />',
    ],
  },
  {
    framework: "general",
    steps: [
      "1. Ensure your project uses React 19+ and TypeScript.",
      "2. Install Tailwind CSS v4 (see tailwindcss.com/docs/installation for your framework).",
      "3. Install TanStack Query (required for data caching across components):\n   pnpm add @tanstack/react-query",
      '4. Wrap your app root with QueryClientProvider:\n   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";\n   const queryClient = new QueryClient();\n   // <QueryClientProvider client={queryClient}><App /></QueryClientProvider>',
      "5. Copy the erc8004 component files into your project.",
      "6. Install any component-specific dependencies listed in the component metadata.",
      '7. Import and use:\n   import { FingerprintBadge } from "./path/to/FingerprintBadge";\n   <FingerprintBadge agentRegistry="eip155:1:0x742..." agentId={22} />',
    ],
  },
];
