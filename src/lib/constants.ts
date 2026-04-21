export const SUBGRAPH_BASE_URL = "https://gateway.thegraph.com/api"

// Subgraph deployment ID per chainId
export const SUBGRAPH_IDS: Record<number, string> = {
  1: "FV6RR6y13rsnCxBAicKuQEwDp8ioEGiNaWaZUmvr1F8k", // Ethereum Mainnet
  8453: "43s9hQRurMGjuYnC1r2ZwS6xSQktbFyXMPMqGKUFJojb", // Base Mainnet
  11155111: "6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT", // Ethereum Sepolia
  84532: "4yYAvQLFjBhBtdRCY7eUWo181VNoTSLLFd5M7FXQAi6u", // Base Sepolia
  137: "9q16PZv1JudvtnCAf44cBoxg82yK9SSsFvrjCY9xnneF", // Polygon Mainnet
  56: "D6aWqowLkWqBgcqmpNKXuNikPkob24ADXCciiP8Hvn1K", // BSC Mainnet
  97: "BTjind17gmRZ6YhT9peaCM13SvWuqztsmqyfjpntbg3Z", // BSC Chapel
  143: "4tvLxkczjhSaMiqRrCV1EyheYHyJ7Ad8jub1UUyukBjg", // Monad Mainnet
  10143: "8iiMH9sj471jbp7AwUuuyBXvPJqCEsobuHBeUEKQSxhU", // Monad Testnet
}
