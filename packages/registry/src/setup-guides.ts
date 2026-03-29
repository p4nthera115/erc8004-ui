import type { SetupGuide } from "./types.js";

export const setupGuides: SetupGuide[] = [
  {
    framework: "vite",
    steps: [
      "1. Install Tailwind CSS v4:\n   pnpm add tailwindcss @tailwindcss/vite",
      '2. Add the Tailwind plugin to vite.config.ts:\n   import tailwindcss from "@tailwindcss/vite";\n   export default defineConfig({ plugins: [tailwindcss()] });',
      '3. Import Tailwind in your main CSS file:\n   @import "tailwindcss";',
      "4. Copy the erc8004 components into your project (e.g., src/components/erc8004/).",
      '5. Import and use:\n   import { FingerprintBadge } from "./components/erc8004/FingerprintBadge";\n   <FingerprintBadge agentRegistry="eip155:1:0x742..." agentId={22} />',
    ],
  },
  {
    framework: "nextjs",
    steps: [
      "1. Install Tailwind CSS v4:\n   pnpm add tailwindcss @tailwindcss/postcss",
      '2. Add Tailwind to postcss.config.mjs:\n   export default { plugins: { "@tailwindcss/postcss": {} } };',
      '3. Import Tailwind in your global CSS:\n   @import "tailwindcss";',
      "4. Copy the erc8004 components into your project (e.g., components/erc8004/).",
      '5. Import and use:\n   import { FingerprintBadge } from "@/components/erc8004/FingerprintBadge";\n   <FingerprintBadge agentRegistry="eip155:1:0x742..." agentId={22} />',
    ],
  },
  {
    framework: "general",
    steps: [
      "1. Ensure your project uses React 19+ and TypeScript.",
      "2. Install Tailwind CSS v4 (see tailwindcss.com/docs/installation for your framework).",
      "3. Copy the erc8004 component files into your project.",
      "4. Install any component-specific dependencies listed in the component metadata.",
      '5. Import and use:\n   import { FingerprintBadge } from "./path/to/FingerprintBadge";\n   <FingerprintBadge agentRegistry="eip155:1:0x742..." agentId={22} />',
    ],
  },
];
