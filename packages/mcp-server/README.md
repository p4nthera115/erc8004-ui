# @erc8004/ui-mcp

MCP server for [`@erc8004/ui`](../../README.md) — component documentation plus
live subgraph checks for ERC-8004 agent UIs.

## Hosted alternative

If you only need the documentation tools, there is nothing to install — the
docs site hosts them over Streamable HTTP:

```bash
claude mcp add --transport http erc8004-ui https://erc8004-ui.vercel.app/api/mcp
```

No key, open CORS, discovery manifest at
<https://erc8004-ui.vercel.app/.well-known/mcp>. It serves `list_components`,
`get_component`, `get_setup_guide` and `get_types`. The two live tools below are
stdio-only: they spend a Graph API key, and a public endpoint should not spend
someone else's quota.

## Install

```bash
claude mcp add erc8004-ui --env GRAPH_API_KEY=your-graph-api-key -- npx -y @erc8004/ui-mcp
```

Or configure the client directly:

```json
{
  "mcpServers": {
    "erc8004-ui": {
      "command": "npx",
      "args": ["-y", "@erc8004/ui-mcp"],
      "env": { "GRAPH_API_KEY": "your-graph-api-key" }
    }
  }
}
```

`GRAPH_API_KEY` is optional. Without it the documentation tools work normally
and the live tools return setup instructions instead of results.

## Tools

| Tool | Network | Purpose |
| --- | --- | --- |
| `list_components` | no | Every component, grouped by registry |
| `get_component` | no | Full docs for one component: props, usage, examples, states |
| `get_setup_guide` | no | Any guide from the docs site |
| `get_types` | no | Exported TypeScript definitions |
| `check_chain_support` | yes | Which components work on a given chain's deployed subgraph |
| `check_agent` | yes | Which components will render data for a specific agent |

The four documentation tools are also served over HTTP by `api/mcp.ts` in the
repo root, against the same snapshot. The two live tools are not.

## Local development

The repo ships a `.mcp.json` at the root that points Claude Code at the local
build. `dist/` is gitignored, so on a fresh clone you must build once before the
server will start:

```bash
pnpm install
pnpm build:mcp
export GRAPH_API_KEY=your-graph-api-key   # optional; live tools need it
```

Then restart your MCP client. Without `GRAPH_API_KEY` the four documentation
tools work and the two live tools return setup instructions.

## How it's built

The documentation tools read `src/generated/registry.json` — a build-time
snapshot of `src/components/docs/registry.tsx` and `scripts/guides-registry.ts`,
the same registries that generate the docs site and `llms.txt`.

The snapshot is emitted by `scripts/generate-llms.ts`, so it regenerates on
exactly the same cadence as the published docs and cannot drift from them. It is
generated, not committed.

Importing `registry.tsx` here directly would work, but would pull React and every
component into a server-side bundle. The snapshot keeps this package dependency-
light and `npx`-able.

```bash
pnpm build:mcp   # from the repo root: regenerates the snapshot, then builds
```

## Why the live tools exist

The deployed subgraph schema drifts from the documented data model. When a chain's
schema stops exposing a query root a component depends on, that component breaks
on that chain while its documentation stays correct — static docs cannot catch
this. `check_chain_support` introspects the live schema and maps it back to
component support. `check_agent` does the same for a specific agent's data.
