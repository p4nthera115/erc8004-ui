// scripts/schema-diff.ts
// Compares deployed schemas across all Agent0 subgraphs.
// Run: GRAPH_API_KEY=xxx npx tsx scripts/schema-diff.ts

import { createHash } from "node:crypto"

const API_KEY = process.env.GRAPH_API_KEY
if (!API_KEY) throw new Error("Set GRAPH_API_KEY")

// All 9 Agent0 subgraphs — fill in any missing IDs from the explorer
const SUBGRAPHS: Record<string, string> = {
  "Ethereum (1)": "FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k",
  "Base (8453)": "43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb",
  "Polygon (137)": "9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF",
  "Sepolia (11155111)": "6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT",
  "Base Sepolia (84532)": "4yYAvQLFjBhBtdRCY7eUWo181VNoTSLLFd5M7FXQAi6u",
  "BSC (56)": "D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K",
  "BSC Chapel (97)": "BTjind17gmRZ6YhT9peaCM13SvWuqztsmqyfjpntbg3Z",
  "Monad (143)": "4tvLxkczjhSaMiqRrCV1EyheYHyJ7Ad8jub1UUyukBjg",
  "Monad Testnet (10143)": "8iiMH9sj471jbp7AwUuuyBXvPJqCEsobuHBeUEKQSxhU",
}

// The entities your library actually queries
const ENTITIES_OF_INTEREST = [
  "Agent",
  "AgentStats",
  "Feedback",
  "FeedbackFile",
  "AgentRegistrationFile",
  "Validation",
]

// Simple introspection — no variables, just ask for all types and their fields
const INTROSPECTION_QUERY = `{
  __schema {
    types {
      name
      fields {
        name
        type {
          name
          kind
          ofType { name }
        }
      }
    }
  }
}`

type FieldMap = Record<string, string[]>

async function fetchSchema(url: string): Promise<FieldMap> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: INTROSPECTION_QUERY }),
  })

  const json = await res.json()

  // Surface the actual error if the query fails
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? JSON.stringify(json.errors))
  }
  if (!json.data) {
    throw new Error(
      `No data returned. Full response: ${JSON.stringify(json).slice(0, 200)}`
    )
  }

  const types: Array<{ name: string; fields: { name: string }[] | null }> =
    json.data.__schema.types

  const result: FieldMap = {}
  for (const t of types) {
    if (!ENTITIES_OF_INTEREST.includes(t.name)) continue
    result[t.name] = (t.fields ?? []).map((f) => f.name).sort()
  }
  return result
}

function fingerprint(schema: FieldMap): string {
  const canonical = JSON.stringify(
    Object.keys(schema)
      .sort()
      .map((k) => [k, schema[k]])
  )
  return createHash("sha256").update(canonical).digest("hex").slice(0, 8)
}

async function main() {
  // Filter out placeholder entries
  const activeSubgraphs = Object.entries(SUBGRAPHS).filter(
    ([, id]) => !id.startsWith("REPLACE")
  )

  console.log(`Checking ${activeSubgraphs.length} subgraphs...\n`)

  const results = await Promise.all(
    activeSubgraphs.map(async ([label, id]) => {
      const url = `https://gateway.thegraph.com/api/${API_KEY}/subgraphs/id/${id}`
      try {
        const schema = await fetchSchema(url)
        return { label, schema, fp: fingerprint(schema) }
      } catch (e) {
        return { label, error: (e as Error).message }
      }
    })
  )

  // Print errors
  const errors = results.filter((r) => "error" in r)
  if (errors.length > 0) {
    console.log("── Errors ──")
    for (const r of errors) {
      if ("error" in r) console.error(`  ❌ ${r.label}: ${r.error}`)
    }
    console.log()
  }

  // Group successful results by fingerprint
  const successes = results.filter((r) => "fp" in r) as {
    label: string
    schema: FieldMap
    fp: string
  }[]

  const groups = new Map<string, { labels: string[]; schema: FieldMap }>()
  for (const r of successes) {
    const existing = groups.get(r.fp)
    if (existing) existing.labels.push(r.label)
    else groups.set(r.fp, { labels: [r.label], schema: r.schema })
  }

  console.log(`Found ${groups.size} distinct schema version(s):\n`)

  let i = 1
  for (const [fp, { labels, schema }] of groups) {
    console.log(`── Group ${i++} (fingerprint ${fp}) ──`)
    console.log(`   Chains: ${labels.join(", ")}`)
    for (const entity of ENTITIES_OF_INTEREST) {
      const fields = schema[entity]
      if (!fields) {
        console.log(`   ${entity}: ⚠️  NOT FOUND`)
      } else {
        console.log(
          `   ${entity} (${fields.length} fields): ${fields.join(", ")}`
        )
      }
    }
    console.log()
  }

  // If multiple groups, show the diff between them
  if (groups.size > 1) {
    const groupList = [...groups.values()]
    console.log("── Field Differences ──")
    for (const entity of ENTITIES_OF_INTEREST) {
      const allFields = new Set(
        groupList.flatMap((g) => g.schema[entity] ?? [])
      )
      for (const field of allFields) {
        const presentIn = groupList
          .map((g, idx) => (g.schema[entity]?.includes(field) ? idx + 1 : null))
          .filter(Boolean)
        if (presentIn.length < groupList.length) {
          console.log(
            `   ${entity}.${field} — only in Group ${presentIn.join(", ")}`
          )
        }
      }
    }
  }
}

main()
