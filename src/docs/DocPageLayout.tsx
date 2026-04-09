import type { ComponentDoc } from "./registry"

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

type TokenType =
  | "keyword"
  | "tag"
  | "attr"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "brace"
  | "punct"
  | "plain"

type Token = { type: TokenType; text: string }

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "#F97583", // keyword scope
  tag: "#79B8FF", // entity.name scope (component names)
  attr: "#b392f0", // support / constant scope (JSX props)
  string: "#9ECBFF", // string scope
  number: "#79B8FF", // constant scope
  comment: "#60666b", // comment scope
  operator: "#F97583", // keyword.operator scope (=)
  brace: "#facc15", // yellow-400 ({})
  punct: "#ffffff", // punctuation
  plain: "#e1e4e8", // editor foreground
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let s = code

  while (s.length > 0) {
    let m: RegExpMatchArray | null

    // JSX block comment {/* ... */}
    if ((m = s.match(/^(\{\/\*[\s\S]*?\*\/\})/))) {
      tokens.push({ type: "comment", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Line comment // ...
    if ((m = s.match(/^(\/\/[^\n]*)/))) {
      tokens.push({ type: "comment", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // String literals
    if (
      (m = s.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/))
    ) {
      tokens.push({ type: "string", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // JSX opening/closing tag name  <Foo  </Foo
    if ((m = s.match(/^(<\/?)([A-Z][A-Za-z0-9]*)/))) {
      tokens.push({ type: "punct", text: m[1] })
      tokens.push({ type: "tag", text: m[2] })
      s = s.slice(m[0].length)
      continue
    }

    // Keywords
    if (
      (m = s.match(
        /^(import|export|from|const|let|var|function|return|type|interface|class)\b/
      ))
    ) {
      tokens.push({ type: "keyword", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Attribute names (word immediately before = or ={)
    if ((m = s.match(/^([a-z][a-zA-Z0-9]*)(?=\s*=)/))) {
      tokens.push({ type: "attr", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Numbers
    if ((m = s.match(/^(\d+)/))) {
      tokens.push({ type: "number", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Operator: =
    if (s[0] === "=") {
      tokens.push({ type: "operator", text: "=" })
      s = s.slice(1)
      continue
    }

    // Braces: { }
    if (s[0] === "{" || s[0] === "}") {
      tokens.push({ type: "brace", text: s[0] })
      s = s.slice(1)
      continue
    }

    // Punctuation
    if ((m = s.match(/^([<>/()\[\];,.])/))) {
      tokens.push({ type: "punct", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Plain word or whitespace
    if ((m = s.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*|\s+|.)/))) {
      tokens.push({ type: "plain", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Fallback: consume one char
    tokens.push({ type: "plain", text: s[0] })
    s = s.slice(1)
  }

  return tokens
}

function HighlightedCode({ code }: { code: string }) {
  const tokens = tokenize(code)
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} style={{ color: TOKEN_COLORS[token.type] }}>
          {token.text}
        </span>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-mono uppercase tracking-widest text-white/80 mb-4">
      {children}
    </h2>
  )
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <>
      <style>{`
        .code-block::-webkit-scrollbar { display: none; }
        .code-block { scrollbar-width: none; }
      `}</style>
      <pre className="code-block overflow-x-auto bg-neutral-950 border border-white/10 px-5 py-4 font-mono text-sm leading-relaxed whitespace-pre">
        <code>
          <HighlightedCode code={code} />
        </code>
      </pre>
    </>
  )
}

function PropRow({ prop }: { prop: ComponentDoc["props"][number] }) {
  return (
    <tr className="border-t border-white/10">
      <td className="py-3 pr-6 font-mono text-sm text-white/90 whitespace-nowrap">
        {prop.name}
      </td>
      <td className="py-3 pr-6 font-mono text-sm text-white/50 whitespace-nowrap">
        {prop.type}
      </td>
      <td className="py-3 pr-6 text-sm text-white/50 whitespace-nowrap">
        {prop.required ? (
          <span className="text-white/70">Yes</span>
        ) : (
          <span className="text-white/30">No</span>
        )}
      </td>
      <td className="py-3 pr-6 font-mono text-sm text-white/30 whitespace-nowrap">
        {prop.default ?? "—"}
      </td>
      <td className="py-3 text-sm text-white/60 leading-relaxed">
        {prop.description}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function DocPageLayout({ doc }: { doc: ComponentDoc }) {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-white">{doc.name}</h1>
        <p className="text-base text-white/60 leading-relaxed max-w-prose">
          {doc.description}
        </p>
      </div>

      {/* Preview */}
      {doc.preview !== null && (
        <section>
          <SectionHeading>Preview</SectionHeading>
          <div className="rounded border border-white/10 bg-white/2 p-8 flex items-center justify-center min-h-32">
            {doc.preview}
          </div>
        </section>
      )}

      {/* Usage */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Usage</SectionHeading>
        <CodeBlock code={doc.importLine} />
        <CodeBlock code={doc.usage} />
      </section>

      {/* API Reference */}
      <section>
        <SectionHeading>API Reference</SectionHeading>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="pb-3 pr-6 font-mono text-xs text-white/40 font-normal uppercase tracking-wider">
                  Prop
                </th>
                <th className="pb-3 pr-6 font-mono text-xs text-white/40 font-normal uppercase tracking-wider">
                  Type
                </th>
                <th className="pb-3 pr-6 font-mono text-xs text-white/40 font-normal uppercase tracking-wider">
                  Required
                </th>
                <th className="pb-3 pr-6 font-mono text-xs text-white/40 font-normal uppercase tracking-wider">
                  Default
                </th>
                <th className="pb-3 font-mono text-xs text-white/40 font-normal uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.props.map((prop) => (
                <PropRow key={prop.name} prop={prop} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
