import { Link } from "@tanstack/react-router"

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface/80 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <img src="/favicon.svg" alt="ERC-8004 UI" className="w-7 h-7" />
            <span className="font-semibold text-text-primary tracking-tight">
              erc8004-ui
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/docs/components/$slug"
              params={{ slug: "fingerprint-badge" }}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-surface-raised"
            >
              Docs
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://eips.ethereum.org/EIPS/eip-8004"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ERC-8004
          </a>
          <a
            href="https://github.com/agent0lab/agent0-ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Agent0 SDK
          </a>
        </div>
      </div>
    </header>
  )
}
