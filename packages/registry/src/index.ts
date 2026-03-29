import { components } from "./components.js";
import { sharedFiles } from "./shared-files.js";
import { setupGuides } from "./setup-guides.js";
import type {
  ComponentDefinition,
  SharedFileDefinition,
  SetupGuide,
} from "./types.js";

export type { ComponentDefinition, SharedFileDefinition, SetupGuide };
export type { FileEntry } from "./types.js";

/** Returns all registered components. */
export function getComponents(): ComponentDefinition[] {
  return components;
}

/** Returns a single component by slug (e.g. "fingerprint-badge") or name (e.g. "FingerprintBadge"). */
export function getComponent(
  nameOrSlug: string,
): ComponentDefinition | undefined {
  const q = nameOrSlug.toLowerCase();
  return components.find(
    (c) => c.slug === q || c.name.toLowerCase() === q,
  );
}

/** Returns all shared file definitions (types, utils, hooks, fetchers). */
export function getSharedFiles(): SharedFileDefinition[] {
  return sharedFiles;
}

/** Returns a single shared file definition by slug. */
export function getSharedFile(
  slug: string,
): SharedFileDefinition | undefined {
  return sharedFiles.find((f) => f.slug === slug);
}

/** Returns the setup guide for a given framework, or the general guide. */
export function getSetupGuide(
  framework?: string,
): SetupGuide {
  const guide = framework
    ? setupGuides.find((g) => g.framework === framework)
    : undefined;
  return guide ?? setupGuides.find((g) => g.framework === "general")!;
}

/**
 * Resolves the full dependency tree for a component,
 * returning all internal shared files it depends on (recursively).
 */
export function resolveInternalDeps(
  component: ComponentDefinition,
): SharedFileDefinition[] {
  const seen = new Set<string>();
  const result: SharedFileDefinition[] = [];

  function resolve(slugs: string[]) {
    for (const slug of slugs) {
      if (seen.has(slug)) continue;
      seen.add(slug);

      // Check shared files first
      const shared = sharedFiles.find((f) => f.slug === slug);
      if (shared) {
        result.push(shared);
      }

      // Check if it's a component dep (for component-to-component deps)
      const comp = components.find((c) => c.slug === slug);
      if (comp) {
        resolve(comp.internalDeps);
      }
    }
  }

  resolve(component.internalDeps);
  return result;
}
