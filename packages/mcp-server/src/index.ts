#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getComponents,
  getComponent,
  getSharedFiles,
  getSharedFile,
  getSetupGuide,
  resolveInternalDeps,
} from "@erc8004-ui/registry";

// Resolve the project root (two levels up from packages/mcp-server/dist/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..", "..");

function readSourceFile(relativePath: string): string {
  const fullPath = resolve(PROJECT_ROOT, relativePath);
  try {
    return readFileSync(fullPath, "utf-8");
  } catch {
    return `[File not found: ${relativePath}]`;
  }
}

const server = new McpServer({
  name: "erc8004-ui",
  version: "0.0.1",
});

// Tool: list_components
server.registerTool("list_components", {
  title: "List Components",
  description:
    "Lists all available ERC-8004 UI components with their name, description, status, and dependencies.",
}, async () => {
  const components = getComponents();
  const listing = components.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
    status: c.status,
    dependencies: c.dependencies,
    internalDeps: c.internalDeps,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(listing, null, 2),
      },
    ],
  };
});

// Tool: get_component
server.registerTool("get_component", {
  title: "Get Component",
  description:
    "Returns the full source code, dependencies, and usage example for an ERC-8004 UI component. Pass the component name or slug (e.g. 'fingerprint-badge' or 'FingerprintBadge').",
  inputSchema: { name: z.string().describe("Component name or slug") },
}, async ({ name }) => {
  const component = getComponent(name);
  if (!component) {
    const available = getComponents().map((c) => c.slug).join(", ");
    return {
      content: [
        {
          type: "text" as const,
          text: `Component "${name}" not found. Available components: ${available}`,
        },
      ],
      isError: true,
    };
  }

  // Read the component's own source files
  const sourceFiles: Record<string, string> = {};
  for (const file of component.files) {
    sourceFiles[file.target] = readSourceFile(file.source);
  }

  // Resolve and read internal dependencies
  const internalDeps = resolveInternalDeps(component);
  const depFiles: Record<string, string> = {};
  for (const dep of internalDeps) {
    for (const file of dep.files) {
      depFiles[file.target] = readSourceFile(file.source);
    }
  }

  const result = {
    component: {
      name: component.name,
      slug: component.slug,
      description: component.description,
      status: component.status,
    },
    files: sourceFiles,
    internalDependencyFiles: depFiles,
    npmDependencies: component.dependencies,
    usage: component.usage,
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// Tool: get_setup_guide
server.registerTool("get_setup_guide", {
  title: "Get Setup Guide",
  description:
    "Returns step-by-step setup instructions for integrating ERC-8004 UI components into your project. Optionally specify a framework (vite, nextjs).",
  inputSchema: {
    framework: z
      .enum(["vite", "nextjs", "general"])
      .optional()
      .describe("Target framework (vite, nextjs, or general)"),
  },
}, async ({ framework }) => {
  const guide = getSetupGuide(framework ?? undefined);

  return {
    content: [
      {
        type: "text" as const,
        text: `# Setup Guide: ${guide.framework}\n\n${guide.steps.join("\n\n")}`,
      },
    ],
  };
});

// Tool: get_types
server.registerTool("get_types", {
  title: "Get Types",
  description:
    "Returns the TypeScript type definitions and constants used by ERC-8004 UI components.",
}, async () => {
  const typesFile = getSharedFile("types");
  const constantsFile = getSharedFile("constants");

  const sections: string[] = [];

  if (typesFile) {
    for (const file of typesFile.files) {
      sections.push(`// === ${file.source} ===\n${readSourceFile(file.source)}`);
    }
  }

  if (constantsFile) {
    for (const file of constantsFile.files) {
      sections.push(`// === ${file.source} ===\n${readSourceFile(file.source)}`);
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: sections.join("\n\n"),
      },
    ],
  };
});

// Tool: get_hooks
server.registerTool("get_hooks", {
  title: "Get Hooks",
  description:
    "Returns the source code of all shared hooks and fetcher functions used by ERC-8004 UI components.",
}, async () => {
  const sharedFiles = getSharedFiles();
  const hookFiles = sharedFiles.filter(
    (f) => f.category === "hooks" || f.category === "fetchers",
  );

  if (hookFiles.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No hooks or fetchers are implemented yet. Components currently handle data fetching internally.",
        },
      ],
    };
  }

  const sections: string[] = [];
  for (const hookFile of hookFiles) {
    for (const file of hookFile.files) {
      sections.push(
        `// === ${file.source} ===\n// ${hookFile.description}\n${readSourceFile(file.source)}`,
      );
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: sections.join("\n\n"),
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exit(1);
});
