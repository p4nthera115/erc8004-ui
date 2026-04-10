# scripts/generate-llms.ts

Generates AI-readable documentation from the canonical component registry.

## What it does

Reads `src/components/docs/registry.tsx` and emits four kinds of files into `public/`:

| Output | Purpose |
| --- | --- |
| `public/llms.txt` | Short index — one line per component, links to per-component `.md` files. The "menu". Follows the [llms.txt spec](https://llmstxt.org). |
| `public/llms-full.txt` | Everything inlined into a single file. The "all-you-can-eat". For AIs that prefer one big fetch over many small ones. |
| `public/llms/{slug}.md` | One markdown file per component — full props table, usage example, description. Lets an AI fetch only what it needs for context efficiency. |
| `public/llms/_guides/{name}.md` | Stub files pointing back to the guide route pages. (Future iteration: inline the prose.) |

After deploy, all of these are live at the root of your domain:

- `https://erc8004-ui.vercel.app/llms.txt`
- `https://erc8004-ui.vercel.app/llms-full.txt`
- `https://erc8004-ui.vercel.app/llms/feedback-list.md`
- etc.

## Why this exists

`registry.tsx` is the single source of truth for every component in the library. The docs site reads from it. This script reads from it. The (planned) MCP server will also read from it. **Adding a new component to `registry.tsx` automatically updates everything else** — site, llms.txt, llms-full.txt, per-component markdown — with zero manual sync.

This is the architectural foundation for the project's "AI-first" goal. Three different consumers (humans on the docs site, AIs fetching markdown, AI tools calling MCP) all hit the same typed data. There is nowhere for documentation drift to hide.

## How it runs

Wired as a `prebuild` hook in `package.json`:

```json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-llms.ts",
    "build": "vite build"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

Every time you (or Vercel) run `npm run build`, the generator runs first, regenerates all the files into `public/`, and then Vite's normal build picks them up as static assets.

You can also run it manually anytime: `npx tsx scripts/generate-llms.ts`.

## Adding a new component

1. Add the component entry to `DOCS` in `src/components/docs/registry.tsx`.
2. That's it. Next build regenerates everything.

If the new component belongs to a category, also add its slug to the appropriate group in the `GROUPS` array near the top of `generate-llms.ts`. (Components not listed in any group still get a per-component `.md` file but won't appear in the `llms.txt` index. This is a deliberate guardrail — drop a `console.warn` if a registry entry isn't grouped.)

## Editing the index format

`buildLlmsTxt()` and `buildLlmsFull()` are the two formatting entrypoints. Both are pure functions that take no arguments and return a string. Edit the markdown shape there. The helpers `componentMarkdown()`, `propsTable()`, and `guideMarkdown()` are shared between them.

## Verifying after deploy

```bash
curl https://erc8004-ui.vercel.app/llms.txt
curl https://erc8004-ui.vercel.app/llms-full.txt
curl https://erc8004-ui.vercel.app/llms/feedback-list.md
```

All three should return raw markdown, not HTML.

## The test that matters

Open a fresh Claude conversation. Paste:

> Read https://erc8004-ui.vercel.app/llms-full.txt and then build me a marketplace card showing an agent's name, image, reputation score, and verification badge using @erc8004/ui.

If Claude produces correct, runnable code with the right imports, prop names, and provider setup — without you telling it anything else — the docs are working. If it gets something wrong, the fix is to improve the relevant entry in `registry.tsx`. Everything downstream regenerates automatically on the next build.

## Future iterations

Things deliberately NOT done in this first version, in priority order:

1. **Inline guide prose into the per-guide markdown stubs.** Currently `_guides/*.md` files are stubs pointing back to the route URLs. The prose lives in `src/routes/pages/*.tsx` as JSX. A future iteration should parse those JSX files and extract the text content so the `_guides` markdown is self-contained and an AI doesn't need to fetch the live HTML site to read them.
2. **MCP server** (`@erc8004/ui-mcp`). Same `registry.tsx` import, different output adapter. Exposes `list_components`, `get_component`, `get_setup_guide` as MCP tools so AI coding agents can query structured data instead of parsing markdown. Build this once `llms.txt` has been used in real workflows and the registry schema is proven stable.
3. **Pre-rendering the demo site.** Add `vite-react-ssg` (or similar) so each route emits real HTML at build time. Fixes the empty-shell problem for Google, link previews, screen readers, and naive AI fetches that don't know about `llms.txt`.
