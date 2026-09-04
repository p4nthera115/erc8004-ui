import { RULE } from "./section"

/** Mainnets with a deployed subgraph — mirrors SUBGRAPH_IDS in src/lib/constants.ts. */
const MAINNETS = [
  { name: "Ethereum", chainId: 1 },
  { name: "Base", chainId: 8453 },
  { name: "Polygon", chainId: 137 },
  { name: "BNB Chain", chainId: 56 },
  { name: "Monad", chainId: 143 },
]

// Mirrors the testnets in SUBGRAPH_IDS (src/lib/constants.ts). Ethereum
// Sepolia was removed — its subgraph is dead and on the old schema.
const TESTNETS = ["Base Sepolia", "BSC Chapel", "Monad Testnet"]

export function ChainStrip() {
  return (
    <section className={`border-b ${RULE} font-mono`}>
      <div className="grid md:grid-cols-5">
        {MAINNETS.map((chain) => (
          <div
            key={chain.chainId}
            className={`flex items-baseline justify-between gap-4 border-t px-6 py-5 md:flex-col md:items-start md:justify-start md:gap-1 md:border-t-0 md:border-r md:px-6 md:py-6 md:last:border-r-0 ${RULE}`}
          >
            <span className="text-sm">{chain.name}</span>
            <span className="text-xs text-text-secondary">
              eip155:{chain.chainId}
            </span>
          </div>
        ))}
      </div>
      <p className={`border-t ${RULE} px-6 py-4 text-xs text-text-secondary md:px-14`}>
        Plus testnets — {TESTNETS.join(", ")}. The chain is read off the
        agent identifier; no network config, no RPC URL, no wallet.
      </p>
    </section>
  )
}
