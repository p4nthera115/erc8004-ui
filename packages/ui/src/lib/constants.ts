export const SUBGRAPH_BASE_URL = "https://gateway.thegraph.com/api"

// Subgraph deployment ID per chainId
//
// Ethereum Sepolia (11155111) is deliberately absent. Its subgraph has been
// halted with a fatal indexing error since 2026-03-19 (`hasIndexingErrors:
// true`, ~169 days stale) and was never migrated to the current schema — it
// still exposes the removed `agentStats` entity and lacks the aggregate
// collections these components query. Omitting it makes getSubgraphUrl throw a
// clear "Unsupported chainId" instead of letting components fail obscurely.
// Use Base Sepolia (84532) for testnet work; it runs the current schema.
export const SUBGRAPH_IDS: Record<number, string> = {
  1: "FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k", // Ethereum Mainnet
  8453: "43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb", // Base Mainnet
  84532: "4yYAvQLFjBhBtdRCY7eUWo181VNoTSLLFd5M7FXQAi6u", // Base Sepolia
  137: "9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF", // Polygon Mainnet
  56: "D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K", // BSC Mainnet
  97: "BTjind17gmRZ6YhT9peaCM13SvWuqztsmqyfjpntbg3Z", // BSC Chapel
  143: "4tvLxkczjhSaMiqRrCV1EyheYHyJ7Ad8jub1UUyukBjg", // Monad Mainnet
  10143: "8iiMH9sj471jbp7AwUuuyBXvPJqCEsobuHBeUEKQSxhU", // Monad Testnet
}
