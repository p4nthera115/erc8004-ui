import type { SharedFileDefinition } from "./types.js";

export const sharedFiles: SharedFileDefinition[] = [
  {
    slug: "types",
    name: "Core Types",
    description:
      "TypeScript interfaces for ERC-8004 data: SharedProps, RegistrationFile, FeedbackEntry, ReputationSummary, ActivityEvent.",
    category: "types",
    files: [
      {
        source: "src/lib/types.ts",
        target: "lib/erc8004/types.ts",
      },
    ],
    dependencies: {},
  },
  {
    slug: "constants",
    name: "Constants",
    description:
      "ERC-8004 constants: interface ID, score ranges.",
    category: "types",
    files: [
      {
        source: "src/lib/constants.ts",
        target: "lib/erc8004/constants.ts",
      },
    ],
    dependencies: {},
  },
  {
    slug: "utils",
    name: "Utilities",
    description:
      "Helper functions: shortenAddress, formatTimestamp.",
    category: "utils",
    files: [
      {
        source: "src/lib/utils.ts",
        target: "lib/erc8004/utils.ts",
      },
    ],
    dependencies: {},
  },
];
