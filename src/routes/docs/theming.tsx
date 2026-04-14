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
          No configuration required — just import the stylesheet and go. Colors
          use OKLCH rather than hex. OKLCH is perceptually uniform — lightening
          or darkening a value produces a predictable visual shift, which makes
          themes easier to build and tweak.
        </p>
        <CodeBlock code={`import "@erc8004/ui/styles.css"`} />
      </div>

      {/* OKLCH Primer */}
      <section className="flex flex-col gap-4">
        <SectionHeading>OKLCH Color Format</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          All color tokens are raw{" "}
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
          values — three space-separated numbers for{" "}
          <InlineCode>lightness chroma hue</InlineCode>:
        </p>
        <ul className="flex flex-col gap-1 text-sm text-neutral-600 dark:text-white/70 leading-relaxed pl-4 list-disc">
          <li>
            <strong className="text-neutral-800 dark:text-white/90">
              Lightness
            </strong>{" "}
            — <InlineCode>0</InlineCode> (black) to{" "}
            <InlineCode>1</InlineCode> (white).
          </li>
          <li>
            <strong className="text-neutral-800 dark:text-white/90">
              Chroma
            </strong>{" "}
            — saturation. <InlineCode>0</InlineCode> is gray, higher values are
            more vivid.
          </li>
          <li>
            <strong className="text-neutral-800 dark:text-white/90">
              Hue
            </strong>{" "}
            — color angle in degrees. <InlineCode>260</InlineCode> blue,{" "}
            <InlineCode>145</InlineCode> green, <InlineCode>300</InlineCode>{" "}
            purple, <InlineCode>25</InlineCode> red-orange.
          </li>
        </ul>
        <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
          For neutral grays, chroma and hue are both <InlineCode>0</InlineCode>{" "}
          (e.g., <InlineCode>0.556 0 0</InlineCode> is a medium gray). Use{" "}
          <a
            href="https://oklch.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-neutral-600 dark:text-white/70 hover:text-neutral-800 dark:hover:text-white/90"
          >
            oklch.com
          </a>{" "}
          to pick values interactively.
        </p>
      </section>

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
          everything coexists cleanly. Dark and light mode work by swapping the
          variable values when a <InlineCode>.dark</InlineCode> or{" "}
          <InlineCode>.light</InlineCode> class is present on an ancestor — see{" "}
          <a
            href="#dark-and-light-mode"
            className="underline underline-offset-2"
          >
            Dark and Light Mode
          </a>{" "}
          below.
        </p>
      </section>

      {/* Three Ways to Customize */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Three Ways to Customize</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Pick the broadest method that does the job. Use CSS variables to
          retheme everything, provider <InlineCode>className</InlineCode> to
          scope a theme to a section of your app, or component{" "}
          <InlineCode>className</InlineCode> for one-off tweaks.
        </p>

        {/* 1. CSS Variable Overrides */}
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-mono text-base text-neutral-800 dark:text-white/90">
            1. CSS Variable Overrides — retheme everything
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

        {/* 2. Provider className */}
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-mono text-base text-neutral-800 dark:text-white/90">
            2. Provider <InlineCode>className</InlineCode> — scope a theme to a
            subtree
          </p>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            The provider accepts a <InlineCode>className</InlineCode> prop that
            gets merged onto the <InlineCode>.erc8004</InlineCode> wrapper. Two
            common uses:
          </p>

          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose mt-1">
            <strong className="text-neutral-800 dark:text-white/90">
              Toggle light or dark mode:
            </strong>
          </p>
          <CodeBlock
            code={`<ERC8004Provider apiKey="..." className="dark">
  {/* dark theme active for all components inside */}
</ERC8004Provider>

<ERC8004Provider apiKey="..." className="light">
  {/* forces light theme, even inside a .dark ancestor */}
</ERC8004Provider>`}
          />

          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose mt-1">
            <strong className="text-neutral-800 dark:text-white/90">
              Apply a custom theme class:
            </strong>
          </p>
          <CodeBlock
            language="css"
            code={`/* Define a custom theme class */
.erc8004.my-brand {
  --erc8004-accent: 0.55 0.25 300;
  --erc8004-radius: 0.75rem;
}`}
          />
          <CodeBlock
            code={`<ERC8004Provider apiKey="..." className="my-brand">
  {/* all components inside use the custom theme */}
</ERC8004Provider>`}
          />
        </div>

        {/* 3. Component className */}
        <div className="flex flex-col gap-3 mt-2">
          <p className="font-mono text-base text-neutral-800 dark:text-white/90">
            3. Component <InlineCode>className</InlineCode> — one-off tweaks
          </p>
          <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
            Every component accepts a <InlineCode>className</InlineCode> prop.
            Your classes override the component's defaults when they target the
            same CSS property — padding replaces padding, background replaces
            background.
          </p>
          <CodeBlock
            code={`<ReputationScore
  agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
  agentId={2290}
  className="shadow-lg rounded-2xl p-6"
/>`}
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

      {/* Dark and Light Mode */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Dark and Light Mode</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The default theme is light — no setup needed. Adding a{" "}
          <InlineCode>.dark</InlineCode> ancestor class switches components to
          dark mode. This is the standard Tailwind dark mode convention that
          most apps already use.
        </p>
        <CodeBlock
          code={`<body class="dark">
  <!-- ERC8004 components automatically use dark colors -->
</body>`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Adding a <InlineCode>.light</InlineCode> ancestor class explicitly
          forces light mode, even inside a <InlineCode>.dark</InlineCode>{" "}
          parent. This is useful for embedding components in a light section of
          an otherwise-dark app.
        </p>
        <CodeBlock
          code={`<body class="dark">
  <!-- dark everywhere... -->

  <div class="light">
    <!-- ...except these components stay light -->
    <ERC8004Provider apiKey="...">
      <ReputationScore agentRegistry="..." agentId={2290} />
    </ERC8004Provider>
  </div>
</body>`}
        />
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Either class can go on <InlineCode>{"<body>"}</InlineCode>, a
          container <InlineCode>div</InlineCode>, or directly on{" "}
          <InlineCode>ERC8004Provider</InlineCode> via the{" "}
          <InlineCode>className</InlineCode> prop. If your app already handles
          dark mode by toggling a <InlineCode>.dark</InlineCode> class, the
          library follows along automatically.
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

        <p className="font-mono text-base text-neutral-800 dark:text-white/90 mt-2">
          Overriding light mode colors
        </p>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          Similarly, to customize colors only in explicit light mode, target{" "}
          <InlineCode>.light .erc8004</InlineCode>:
        </p>
        <CodeBlock
          language="css"
          code={`.light .erc8004 {
  --erc8004-accent: 0.5 0.22 260;     /* deeper blue in light mode */
  --erc8004-card: 0.98 0.005 80;      /* warm white cards */
}`}
        />
      </section>

      {/* Token Reference */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Token Reference</SectionHeading>

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
  agentRegistry="eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
  agentId={2290}
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

      {/* Provider Props */}
      <section className="flex flex-col gap-4">
        <SectionHeading>Provider Props</SectionHeading>
        <p className="text-sm text-neutral-700 dark:text-white leading-relaxed max-w-prose">
          The only theming-relevant prop on{" "}
          <InlineCode>ERC8004Provider</InlineCode> is{" "}
          <InlineCode>className</InlineCode>, which gets merged onto the{" "}
          <InlineCode>.erc8004</InlineCode> wrapper. See the{" "}
          <a
            href="/docs/components/erc8004-provider"
            className="underline underline-offset-2"
          >
            ERC8004Provider component page
          </a>{" "}
          for the full prop reference.
        </p>
        <CodeBlock
          code={`<ERC8004Provider apiKey="..." className="dark my-theme">
  {children}
</ERC8004Provider>`}
        />
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <SectionHeading>FAQ</SectionHeading>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-neutral-800 dark:text-white/90">
              Does the library ship its own font?
            </p>
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              No. Components inherit <InlineCode>font-family</InlineCode> from
              their parent, so they adopt whatever typography your app uses. Set
              the font on <InlineCode>.erc8004</InlineCode> or any ancestor and
              components will follow. Some elements like numeric scores and
              addresses use monospace (<InlineCode>font-mono</InlineCode>) for
              readability, but no base font is bundled or required.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-neutral-800 dark:text-white/90">
              Can I force light mode inside a dark app?
            </p>
            <p className="text-sm text-neutral-500 dark:text-white/60 leading-relaxed max-w-prose">
              Yes. Add <InlineCode>className="light"</InlineCode> to the
              provider (or any ancestor of the components you want to stay
              light). This works even when a higher ancestor has{" "}
              <InlineCode>.dark</InlineCode> set.
            </p>
          </div>

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
