export interface ComponentDefinition {
  name: string;
  slug: string;
  description: string;
  category: "identity" | "reputation" | "activity" | "status";
  status: "stable" | "beta" | "planned";
  files: FileEntry[];
  dependencies: Record<string, string>;
  internalDeps: string[];
  usage: string;
}

export interface FileEntry {
  /** Path relative to project root (e.g. "src/components/FingerprintBadge.tsx") */
  source: string;
  /** Where the CLI/agent should place this file (e.g. "components/erc8004/FingerprintBadge.tsx") */
  target: string;
}

export interface SharedFileDefinition {
  slug: string;
  name: string;
  description: string;
  category: "types" | "utils" | "hooks" | "fetchers";
  files: FileEntry[];
  dependencies: Record<string, string>;
}

export interface SetupGuide {
  framework: string;
  steps: string[];
}
