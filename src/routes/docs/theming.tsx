import { createFileRoute } from "@tanstack/react-router"
import { InlineCode, CodeBlock } from "@/components/docs/CodeBlock"
import { SectionHeading } from "@/components/docs/DocPageLayout"
import { ThemePlayground } from "@/components/docs/ThemePlayground"

export const Route = createFileRoute("/docs/theming")({
  component: Theming,
})

function Theming() {
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-3xl font-bold text-neutral-900 dark:text-white">
          Theming
        </h1>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          <InlineCode>@erc8004/ui</InlineCode> uses CSS variables for theming.
          This gives you a set of named color and radius tokens that every
          component references. Override those tokens in your CSS to change the
          look of the entire library without touching component code.
        </p>
        <p className="text-base text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          Out of the box, the library ships with a light theme and a dark theme.
          No configuration required — just import the stylesheet and go.
        </p>
        <CodeBlock code={`import "@erc8004/ui/styles.css"`} />
      </div>

      {/* Theme Playground */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Playground</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Click a preset to see all the token changes take effect live. The code
          block below the preview shows exactly what CSS you would write to
          reproduce that theme in your own app.
        </p>
        <ThemePlayground />
      </section>

      {/* How It Works */}
      <section className="flex flex-col gap-4">
        <SectionHeading>How It Works</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Every component in the library uses Tailwind classes like{" "}
          <InlineCode>bg-erc8004-card</InlineCode> and{" "}
          <InlineCode>text-erc8004-muted-fg</InlineCode> instead of hardcoded
          colors. These classes reference CSS variables defined under the{" "}
          <InlineCode>.erc8004</InlineCode> scope — a wrapper that the{" "}
          <InlineCode>ERC8004Provider</InlineCode> renders automatically.
        </p>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Because the variables are scoped to <InlineCode>.erc8004</InlineCode>,
          they never conflict with your app's own styles. If your app uses
          shadcn, Tailwind's default palette, or any other styling system,
          everything coexists cleanly.
        </p>
      </section>

      {/* Three Ways to Customize */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Three Ways to Customize</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          You have three levels of control, from broadest to most specific. They
          compose naturally — use any combination.
        </p>

        {/* CSS Variable Overrides */}
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-mono text-base text-neutral-800 dark:text-white/90">
            1. CSS Variable Overrides (retheme everything)
          </p>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            Override the variables in your own stylesheet. Every component picks
            up the changes instantly.
          </p>
          <CodeBlock
            language="css"
            code={`/* your-app.css */
.erc8004 {
  --erc8004-accent: 0.55 0.25 300;   /* purple instead of blue */
  --erc8004-radius: 0.75rem;          /* rounder corners */
}`}
          />
        </div>

        {/* className Prop */}
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-mono text-base text-neutral-800 dark:text-white/90">
            2. <InlineCode>className</InlineCode> Prop (customize one instance)
          </p>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            Every component accepts a <InlineCode>className</InlineCode> prop.
            Your classes override the component's defaults when they target the
            same CSS property — padding replaces padding, background replaces
            background.
          </p>
          <CodeBlock
            code={`<ReputationScore
  agentRegistry="eip155:1:0x742..."
  agentId={374}
  className="shadow-lg rounded-2xl p-6"
/>`}
          />
        </div>

        {/* className on Provider */}
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-mono text-base text-neutral-800 dark:text-white/90">
            3. <InlineCode>className</InlineCode> on Provider (scope a class)
          </p>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            The provider accepts a <InlineCode>className</InlineCode> prop that
            gets merged onto the <InlineCode>.erc8004</InlineCode> wrapper. This
            is useful for scoping dark mode or applying a custom theme class.
          </p>
          <CodeBlock
            code={`<ERC8004Provider apiKey="your-graph-api-key" className="dark">
  {/* dark theme active for all components inside */}
</ERC8004Provider>`}
          />
          <CodeBlock
            language="css"
            code={`/* Define a custom theme class */
.erc8004.my-brand {
  --erc8004-accent: 0.55 0.25 300;
  --erc8004-radius: 0.75rem;
}`}
          />
          <CodeBlock
            code={`<ERC8004Provider apiKey="your-graph-api-key" className="my-brand">
  {/* all components inside use the custom theme */}
</ERC8004Provider>`}
          />
        </div>
      </section>

      {/* Token Convention */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Token Convention</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Tokens follow a{" "}
          <strong className="text-neutral-800 dark:text-white/90">
            background / foreground pair
          </strong>{" "}
          pattern. The base token controls the surface color, and the{" "}
          <InlineCode>-fg</InlineCode> suffixed token controls the text and icon
          color that sits on that surface.
        </p>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          For example, given these variables:
        </p>
        <CodeBlock
          language="css"
          code={`.erc8004 {
  --erc8004-card: 1 0 0;          /* white surface */
  --erc8004-card-fg: 0.145 0 0;   /* near-black text */
}`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          A component using{" "}
          <InlineCode>bg-erc8004-card text-erc8004-card-fg</InlineCode> will
          render dark text on a white card. Override the variables, and the
          component adapts — you never need to change the component itself.
        </p>
      </section>

      {/* Token Reference */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Token Reference</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          All color values are raw{" "}
          <InlineCode>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              OKLCH
            </a>
          </InlineCode>{" "}
          values: <InlineCode>lightness chroma hue</InlineCode>.
        </p>
        <ul className="flex flex-col gap-1 text-sm text-neutral-600 dark:text-white/70 leading-relaxed pl-4 list-disc">
          <li>
            <strong className="text-neutral-800 dark:text-white/90">
              Lightness
            </strong>{" "}
            ranges from <InlineCode>0</InlineCode> (black) to{" "}
            <InlineCode>1</InlineCode> (white).
          </li>
          <li>
            <strong className="text-neutral-800 dark:text-white/90">
              Chroma
            </strong>{" "}
            controls saturation — <InlineCode>0</InlineCode> is gray, higher
            values are more vivid.
          </li>
          <li>
            <strong className="text-neutral-800 dark:text-white/90">Hue</strong>{" "}
            is the color angle — <InlineCode>0</InlineCode> is pink/red,{" "}
            <InlineCode>145</InlineCode> is green, <InlineCode>260</InlineCode>{" "}
            is blue, <InlineCode>300</InlineCode> is purple.
          </li>
        </ul>
        <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          For neutral grays, chroma and hue are both <InlineCode>0</InlineCode>{" "}
          (e.g., <InlineCode>0.556 0 0</InlineCode> is a medium gray).
        </p>

        {/* Surfaces table */}
        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Surfaces
        </p>
        <TokenTable
          rows={[
            [
              "Background",
              "--erc8004-bg",
              "1 0 0",
              "Default component background",
            ],
            ["Foreground", "--erc8004-fg", "0.145 0 0", "Default text color"],
            [
              "Card",
              "--erc8004-card",
              "1 0 0",
              "Elevated surface background (cards, panels)",
            ],
            [
              "Card foreground",
              "--erc8004-card-fg",
              "0.145 0 0",
              "Text on elevated surfaces",
            ],
            [
              "Muted",
              "--erc8004-muted",
              "0.97 0 0",
              "Subtle backgrounds (tags, skeletons, empty states)",
            ],
            [
              "Muted foreground",
              "--erc8004-muted-fg",
              "0.556 0 0",
              "Secondary text (timestamps, descriptions, helper text)",
            ],
          ]}
        />

        {/* Accent table */}
        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Accent
        </p>
        <TokenTable
          rows={[
            [
              "Accent",
              "--erc8004-accent",
              "0.55 0.2 260",
              "Brand color, primary actions, active highlights",
            ],
            [
              "Accent foreground",
              "--erc8004-accent-fg",
              "0.985 0 0",
              "Text on accent surfaces",
            ],
          ]}
        />

        {/* Semantic table */}
        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Semantic
        </p>
        <TokenTable
          rows={[
            [
              "Positive",
              "--erc8004-positive",
              "0.55 0.17 145",
              "Positive scores, success indicators",
            ],
            [
              "Positive foreground",
              "--erc8004-positive-fg",
              "0.985 0 0",
              "Text on positive surfaces",
            ],
            [
              "Negative",
              "--erc8004-negative",
              "0.55 0.2 25",
              "Negative scores, error states",
            ],
            [
              "Negative foreground",
              "--erc8004-negative-fg",
              "0.985 0 0",
              "Text on negative surfaces",
            ],
          ]}
        />

        {/* Borders & Focus table */}
        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Borders &amp; Focus
        </p>
        <TokenTable
          rows={[
            [
              "Border",
              "--erc8004-border",
              "0.922 0 0",
              "All borders and dividers",
            ],
            [
              "Ring",
              "--erc8004-ring",
              "0.55 0.2 260",
              "Focus ring on interactive elements",
            ],
          ]}
        />

        {/* Chart Palette table */}
        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Chart Palette
        </p>
        <TokenTable
          rows={[
            [
              "Chart 1",
              "--erc8004-chart-1",
              "0.55 0.2 260",
              "First chart color (blue)",
            ],
            [
              "Chart 2",
              "--erc8004-chart-2",
              "0.6 0.18 145",
              "Second chart color (green)",
            ],
            [
              "Chart 3",
              "--erc8004-chart-3",
              "0.6 0.2 25",
              "Third chart color (red-orange)",
            ],
            [
              "Chart 4",
              "--erc8004-chart-4",
              "0.65 0.2 310",
              "Fourth chart color (purple)",
            ],
            [
              "Chart 5",
              "--erc8004-chart-5",
              "0.7 0.15 70",
              "Fifth chart color (gold)",
            ],
          ]}
        />

        {/* Radius table */}
        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Radius
        </p>
        <TokenTable
          rows={[
            [
              "Radius",
              "--erc8004-radius",
              "0.5rem",
              "Base corner radius — all sizes derive from this",
            ],
          ]}
        />
      </section>

      {/* Radius Scale */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Radius Scale</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The library derives a set of radius sizes from the single{" "}
          <InlineCode>--erc8004-radius</InlineCode> base value:
        </p>
        <div className="border border-black/60 dark:border-white/10 divide-y divide-black/60 dark:divide-white/10 text-sm font-mono">
          <div className="grid grid-cols-3 px-4 py-2 text-neutral-400 dark:text-white/40 text-xs uppercase tracking-wider">
            <span>Class</span>
            <span>Size</span>
            <span>Formula</span>
          </div>
          {[
            ["rounded-erc8004-sm", "0.3rem", "radius × 0.6"],
            ["rounded-erc8004-md", "0.4rem", "radius × 0.8"],
            ["rounded-erc8004-lg", "0.5rem", "radius × 1.0 (the base)"],
            ["rounded-erc8004-xl", "0.7rem", "radius × 1.4"],
            ["rounded-erc8004-2xl", "0.9rem", "radius × 1.8"],
          ].map(([cls, size, formula]) => (
            <div key={cls} className="grid grid-cols-3 px-4 py-2.5">
              <span className="text-neutral-800 dark:text-white/90">{cls}</span>
              <span className="text-neutral-500 dark:text-white/60">
                {size}
              </span>
              <span className="text-neutral-500 dark:text-white/50">
                {formula}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Change <InlineCode>--erc8004-radius</InlineCode> once, and the entire
          radius scale updates proportionally:
        </p>
        <CodeBlock
          language="css"
          code={`.erc8004 {
  --erc8004-radius: 0.75rem;  /* everything gets rounder */
}`}
        />
        <CodeBlock
          language="css"
          code={`.erc8004 {
  --erc8004-radius: 0;  /* sharp corners everywhere */
}`}
        />
      </section>

      {/* Dark Mode */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Dark Mode</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The library ships with a dark theme that activates automatically when
          the components are inside an ancestor with the{" "}
          <InlineCode>.dark</InlineCode> class. This is the standard Tailwind
          dark mode convention that most apps already use.
        </p>
        <CodeBlock
          code={`<body class="dark">
  <!-- ERC8004 components automatically use dark colors -->
</body>`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          You can also apply <InlineCode>.dark</InlineCode> directly to the
          provider's scope:
        </p>
        <CodeBlock
          code={`<ERC8004Provider apiKey="..." className="dark">
  {/* dark theme active */}
</ERC8004Provider>`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          No configuration, no toggle logic, no extra imports. If your app
          already handles dark mode by toggling a <InlineCode>.dark</InlineCode>{" "}
          class, the library follows along.
        </p>

        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Overriding dark mode colors
        </p>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          To customize specific colors in dark mode, target{" "}
          <InlineCode>.dark .erc8004</InlineCode>:
        </p>
        <CodeBlock
          language="css"
          code={`.dark .erc8004 {
  --erc8004-accent: 0.7 0.2 260;      /* brighter blue in dark mode */
  --erc8004-card: 0.18 0.01 260;      /* slight blue tint to cards */
}`}
        />
      </section>

      {/* Examples */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Examples</SectionHeading>

        <p className="font-mono text-base text-neutral-800 dark:text-white/90">
          Match your brand color
        </p>
        <CodeBlock
          language="css"
          code={`.erc8004 {
  --erc8004-accent: 0.55 0.25 300;      /* purple */
  --erc8004-ring: 0.55 0.25 300;        /* focus rings match */
}`}
        />

        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Warm neutral palette
        </p>
        <CodeBlock
          language="css"
          code={`.erc8004 {
  --erc8004-bg: 0.98 0.005 80;          /* warm white */
  --erc8004-card: 0.96 0.008 80;        /* warm off-white */
  --erc8004-muted: 0.94 0.01 80;        /* warm gray */
  --erc8004-border: 0.9 0.01 80;        /* warm border */
}`}
        />

        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Compact with sharp corners
        </p>
        <CodeBlock
          code={`<ReputationScore
  agentRegistry="eip155:1:0x742..."
  agentId={374}
  className="p-2 text-sm rounded-none"
/>`}
        />

        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Full custom theme via CSS class
        </p>
        <CodeBlock
          language="css"
          code={`/* teal-brand.css */
.erc8004.teal-brand {
  --erc8004-accent: 0.6 0.22 160;       /* teal */
  --erc8004-positive: 0.6 0.22 160;     /* match accent for positive */
  --erc8004-negative: 0.55 0.2 0;       /* warm red */
  --erc8004-border: 0.88 0.01 160;      /* subtle teal borders */
  --erc8004-radius: 1rem;               /* very rounded */
}`}
        />
        <CodeBlock
          code={`<ERC8004Provider apiKey="your-graph-api-key" className="teal-brand">
  {/* all components use the teal theme */}
</ERC8004Provider>`}
        />
      </section>

      {/* Provider Props Reference */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Provider Props</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          <InlineCode>ERC8004Provider</InlineCode> accepts the following props:
        </p>
        <CodeBlock
          code={`<ERC8004Provider
  apiKey="your-graph-api-key"     // required — The Graph API key
  subgraphOverrides={{ 1: "..." }} // optional — custom Subgraph URLs per chain
  className="dark my-theme"        // optional — classes for the .erc8004 wrapper
>
  {children}
</ERC8004Provider>`}
        />
        <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          To customize the look of the library, override CSS variables on{" "}
          <InlineCode>.erc8004</InlineCode> in your stylesheet — see the token
          reference above.
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <SectionHeading>FAQ</SectionHeading>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-neutral-800 dark:text-white/90">
              Will this conflict with my app's Tailwind config?
            </p>
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              No. All tokens are namespaced under{" "}
              <InlineCode>erc8004-</InlineCode> and scoped to the{" "}
              <InlineCode>.erc8004</InlineCode> class. They don't touch your
              app's <InlineCode>--primary</InlineCode>,{" "}
              <InlineCode>--background</InlineCode>, or any other standard
              Tailwind/shadcn variables.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-neutral-800 dark:text-white/90">
              Do I need Tailwind in my project to use{" "}
              <InlineCode>className</InlineCode>?
            </p>
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              Not strictly — <InlineCode>className</InlineCode> accepts any CSS
              class string. But the library is built with Tailwind, so
              overriding with Tailwind classes gives you the most predictable
              results since <InlineCode>tailwind-merge</InlineCode> understands
              the conflict resolution. If your project doesn't use Tailwind, you
              can still pass regular CSS classes or use the CSS variable
              overrides instead.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-neutral-800 dark:text-white/90">
              Can I theme individual components differently?
            </p>
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              Yes. Wrap a subset of components in a <InlineCode>div</InlineCode>{" "}
              with overridden variables:
            </p>
            <CodeBlock
              code={`<ERC8004Provider apiKey="...">
  {/* These use the default theme */}
  <ReputationScore agentRegistry="..." agentId={1} />

  {/* These use a custom accent */}
  <div style={{ "--erc8004-accent": "0.55 0.25 300" } as React.CSSProperties}>
    <ReputationScore agentRegistry="..." agentId={2} />
    <FeedbackList agentRegistry="..." agentId={2} />
  </div>
</ERC8004Provider>`}
            />
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              Since CSS variables inherit downward, any{" "}
              <InlineCode>div</InlineCode> that redefines a variable creates a
              new scope for its children.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-neutral-800 dark:text-white/90">
              What color format should I use?
            </p>
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              Raw OKLCH values: three space-separated numbers for lightness,
              chroma, and hue. For example,{" "}
              <InlineCode>0.55 0.2 260</InlineCode> is a medium-brightness blue.
              You can use any OKLCH color picker to find values. For grays, set
              chroma and hue to <InlineCode>0</InlineCode> (e.g.,{" "}
              <InlineCode>0.5 0 0</InlineCode> is medium gray).
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function TokenTable({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <div className="border border-black/60 dark:border-white/10 divide-y divide-black/60 dark:divide-white/10 text-sm overflow-x-auto">
      <div className="grid grid-cols-4 px-4 py-2 text-neutral-400 dark:text-white/40 text-xs uppercase tracking-wider font-mono">
        <span>Token</span>
        <span>CSS Variable</span>
        <span>Default (Light)</span>
        <span>What it controls</span>
      </div>
      {rows.map(([token, cssVar, defaultVal, description]) => (
        <div key={cssVar} className="grid grid-cols-4 px-4 py-2.5 gap-x-4">
          <span className="text-neutral-800 dark:text-white/90">{token}</span>
          <span className="font-mono text-neutral-500 dark:text-white/60 text-xs">
            {cssVar}
          </span>
          <span className="font-mono text-neutral-500 dark:text-white/50 text-xs">
            {defaultVal}
          </span>
          <span className="text-neutral-500 dark:text-white/50">
            {description}
          </span>
        </div>
      ))}
    </div>
  )
}
