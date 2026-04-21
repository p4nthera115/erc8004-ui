import { useState } from "react"
import { FaCheck } from "react-icons/fa6"
import { IoCopy } from "react-icons/io5"

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

type TokenType =
  | "keyword"
  | "tag"
  | "htmltag"
  | "attr"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "brace"
  | "punct"
  | "plain"

type Token = { type: TokenType; text: string }

const TOKEN_CSS = `
  .cb-keyword  { color: #d6336c }
  .cb-tag      { color: #1864ab }
  .cb-htmltag  { color: #16a34a }
  .cb-attr     { color: #6741d9 }
  .cb-string   { color: #2f9e44 }
  .cb-number   { color: #1971c2 }
  .cb-comment  { color: #868e96 }
  .cb-operator { color: #d6336c }
  .cb-brace    { color: #d08700 }
  .cb-punct    { color: #343a40 }
  .cb-plain    { color: #1c1c1c }
  .dark .cb-keyword  { color: #F97583 }
  .dark .cb-tag      { color: #79B8FF }
  .dark .cb-htmltag  { color: #86efac }
  .dark .cb-attr     { color: #b392f0 }
  .dark .cb-string   { color: #9ECBFF }
  .dark .cb-number   { color: #79B8FF }
  .dark .cb-comment  { color: #60666b }
  .dark .cb-operator { color: #F97583 }
  .dark .cb-brace    { color: #facc15 }
  .dark .cb-punct    { color: #ffffff }
  .dark .cb-plain    { color: #e1e4e8 }
`

function tokenizeCss(code: string): Token[] {
  const tokens: Token[] = []
  let s = code
  let depth = 0 // brace depth — 0 = selector context, >0 = declaration context

  while (s.length > 0) {
    let m: RegExpMatchArray | null

    // Block comment /* ... */
    if ((m = s.match(/^(\/\*[\s\S]*?\*\/)/))) {
      tokens.push({ type: "comment", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // String literals
    if ((m = s.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/))) {
      tokens.push({ type: "string", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // At-rules: @import @theme @custom-variant etc.
    if ((m = s.match(/^(@[a-zA-Z-]+)/))) {
      tokens.push({ type: "keyword", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Hex color values (before ID selector check)
    if ((m = s.match(/^(#[0-9a-fA-F]{3,8}(?![a-zA-Z_-]))/))) {
      tokens.push({ type: "string", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // CSS custom properties --var-name
    if ((m = s.match(/^(--[a-zA-Z0-9-]+)/))) {
      tokens.push({ type: "attr", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Pseudo-classes / pseudo-elements  :hover  ::before
    if ((m = s.match(/^(::?[a-zA-Z-]+)/))) {
      tokens.push({ type: "keyword", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Class selectors .foo
    if ((m = s.match(/^(\.[a-zA-Z_-][a-zA-Z0-9_-]*)/))) {
      tokens.push({ type: "tag", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // ID selectors #foo
    if ((m = s.match(/^(#[a-zA-Z_-][a-zA-Z0-9_-]*)/))) {
      tokens.push({ type: "tag", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Numbers with optional units
    if (
      (m = s.match(/^(\d+\.?\d*(?:px|em|rem|%|vh|vw|dvh|dvw|s|ms|deg|ch|ex)?)/))
    ) {
      tokens.push({ type: "number", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Braces — track depth to distinguish selectors from properties
    if (s[0] === "{") {
      depth++
      tokens.push({ type: "brace", text: "{" })
      s = s.slice(1)
      continue
    }
    if (s[0] === "}") {
      depth--
      tokens.push({ type: "brace", text: "}" })
      s = s.slice(1)
      continue
    }

    // Inside a block: word followed by colon = property name
    if (depth > 0 && (m = s.match(/^([a-zA-Z-]+)(?=\s*:)/))) {
      tokens.push({ type: "attr", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Outside a block: lowercase word = HTML element selector
    if (depth === 0 && (m = s.match(/^([a-z][a-z0-9-]*)/))) {
      tokens.push({ type: "htmltag", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Punctuation
    if ((m = s.match(/^([;:,()\[\]>~+*])/))) {
      tokens.push({ type: "punct", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    // Plain word or whitespace
    if ((m = s.match(/^([a-zA-Z_-][a-zA-Z0-9_-]*|\s+|.)/))) {
      tokens.push({ type: "plain", text: m[1] })
      s = s.slice(m[1].length)
      continue
    }

    tokens.push({ type: "plain", text: s[0] })
    s = s.slice(1)
  }

  return tokens
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

    // HTML semantic element  <div  </main  <section  etc.
    if ((m = s.match(/^(<\/?)([a-z][a-z0-9]*)/))) {
      tokens.push({ type: "punct", text: m[1] })
      tokens.push({ type: "htmltag", text: m[2] })
      s = s.slice(m[0].length)
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

function HighlightedCode({
  code,
  language,
}: {
  code: string
  language: string
}) {
  const tokens = language === "css" ? tokenizeCss(code) : tokenize(code)
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={`cb-${token.type}`}>
          {token.text}
        </span>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Exported components
// ---------------------------------------------------------------------------

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-neutral-700 dark:text-white/80 bg-neutral-200 dark:bg-white/15 px-1.5 py-0.5 rounded text-[0.85em]">
      {children}
    </code>
  )
}

export function CodeBlock({
  code,
  language = "tsx",
}: {
  code: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)
  const isTerminal = language === "terminal"
  const lines = code.split("\n")

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <style>{`
        .code-block::-webkit-scrollbar { display: none; }
        .code-block { scrollbar-width: none; }
        ${TOKEN_CSS}
      `}</style>
      <div className="flex bg-neutral-200 dark:bg-neutral-900 border border-black/10 dark:border-white/10">
        <pre className="code-block flex-1 min-w-0 overflow-x-auto py-4 font-mono text-sm leading-relaxed whitespace-pre">
          <code>
            {isTerminal
              ? lines.map((line, i) => (
                  <span key={i} className="flex">
                    <span className="shrink-0 w-14 pl-4 text-right pr-6 select-none text-neutral-400 dark:text-neutral-600">
                      $
                    </span>
                    <span className="cb-plain">{line}</span>
                    {i < lines.length - 1 && "\n"}
                  </span>
                ))
              : lines.map((line, i) => (
                  <span key={i} className="flex">
                    <span className="shrink-0 w-14 pl-4 text-right pr-6 select-none text-neutral-400 dark:text-neutral-600">
                      {i + 1}
                    </span>
                    <span>
                      <HighlightedCode code={line} language={language} />
                    </span>
                    {i < lines.length - 1 && "\n"}
                  </span>
                ))}
          </code>
        </pre>
        <div className="shrink-0 pt-3 pr-3 ml-3">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-300/50 hover:bg-neutral-300 dark:bg-white/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? <FaCheck size={14} /> : <IoCopy size={14} />}
          </button>
        </div>
      </div>
    </>
  )
}
