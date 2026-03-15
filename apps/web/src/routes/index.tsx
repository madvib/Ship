import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Layers, Zap, Bot, ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { ProviderLogo } from '../features/compiler/ProviderLogo'

export const Route = createFileRoute('/')({ component: HomePage })

const PROVIDER_TABS = [
  { id: 'claude',  label: 'Claude Code' },
  { id: 'gemini',  label: 'Gemini CLI'  },
  { id: 'codex',   label: 'Codex CLI'   },
  { id: 'cursor',  label: 'Cursor'      },
]

const PROVIDER_OUTPUTS: Record<string, { filename: string; content: string }> = {
  claude: {
    filename: 'CLAUDE.md + .mcp.json',
    content: `# CLAUDE.md

## Rules
Use TypeScript. Prefer explicit types.
No workarounds without a linked issue.

## Skills
- Smart Commit: atomic, well-described commits
- Shipflow: plan → build → wrap up

## MCP servers
- github: search repos, manage PRs
- memory: persist context across sessions`,
  },
  gemini: {
    filename: 'GEMINI.md + .gemini/settings.json',
    content: `# GEMINI.md

## Rules
Use TypeScript. Prefer explicit types.
No workarounds without a linked issue.

## Skills
- Smart Commit: atomic, well-described commits
- Shipflow: plan → build → wrap up`,
  },
  codex: {
    filename: 'AGENTS.md + .codex/config.toml',
    content: `# AGENTS.md

## Rules
Use TypeScript. Prefer explicit types.
No workarounds without a linked issue.

## Skills
- Smart Commit: atomic, well-described commits
- Shipflow: plan → build → wrap up`,
  },
  cursor: {
    filename: '.cursor/mcp.json + .cursor/rules/',
    content: `// .cursor/mcp.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}`,
  },
}

function HomePage() {
  const [activeProvider, setActiveProvider] = useState('claude')
  const output = PROVIDER_OUTPUTS[activeProvider]

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-24 sm:px-10 sm:pt-32">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.67_0.16_58_/_18%),transparent_66%)]" />
        <div className="pointer-events-none absolute -right-32 -top-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.61_0.23_303_/_14%),transparent_66%)]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            <Sparkles className="size-3" />
            Early Access
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold tracking-tight sm:text-7xl">
            Your agents,{' '}
            <span className="text-primary">your rules.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Configure MCP servers, skills, and permissions once — export to Claude Code, Gemini CLI, Codex CLI, and Cursor with a single click.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/studio"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Open Studio
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-border/80"
            >
              How it works
              <ChevronDown className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="border-y border-border/60 bg-muted/30 px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Export to
          </p>

          {/* Provider tab pills */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {PROVIDER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProvider(tab.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeProvider === tab.id
                    ? 'border-primary/30 bg-primary/10 text-foreground'
                    : 'border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <ProviderLogo provider={tab.id} size="sm" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Animated output preview */}
          <div
            key={activeProvider}
            className="overflow-hidden rounded-xl border border-border/60 bg-card animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <ProviderLogo provider={activeProvider} size="sm" />
              <p className="font-mono text-[11px] font-medium text-muted-foreground">{output.filename}</p>
            </div>
            <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-foreground/80">{output.content}</pre>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Layers,
                step: '01',
                title: 'Build your library',
                description: 'Add MCP servers, skills, and rules from the curated catalog or your own.',
              },
              {
                icon: Zap,
                step: '02',
                title: 'Configure your mode',
                description: 'Choose which AI agents to target. Permissions apply per provider automatically.',
              },
              {
                icon: Bot,
                step: '03',
                title: 'Export everywhere',
                description: 'Download provider-native config files. All agents start with the same context.',
              },
            ].map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-display text-2xl font-bold text-primary/25">{step}</span>
                  <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                </div>
                <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 sm:px-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center">
          <h2 className="mb-3 font-display text-2xl font-bold sm:text-3xl">
            Ready to unify your agent stack?
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Configure once and get provider-ready output files in seconds — entirely in your browser.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Open Ship Studio
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  )
}
