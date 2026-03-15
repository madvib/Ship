import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Bot, Zap, ArrowRight, Layers, Sparkles, ChevronDown } from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

const PROVIDER_TABS = [
  { id: 'claude', label: 'Claude Code', color: 'text-amber-600 dark:text-amber-400' },
  { id: 'gemini', label: 'Gemini CLI', color: 'text-blue-600 dark:text-blue-400' },
  { id: 'codex', label: 'Codex CLI', color: 'text-emerald-600 dark:text-emerald-400' },
]

const EXAMPLE_CONFIG = `[project]
name = "my-app"
providers = ["claude", "gemini"]

[[mcp_servers]]
id = "github"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "$GITHUB_TOKEN" }

[[skills]]
id = "ship-workflow"
name = "Ship Workflow"

[[rules]]
id = "code-style"
file_name = "code-style.md"
`

function HomePage() {
  const [activeProvider, setActiveProvider] = useState('claude')

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-24 sm:px-10 sm:pt-32">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.67_0.16_58_/_18%),transparent_66%)]" />
        <div className="pointer-events-none absolute -right-32 -top-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.61_0.23_303_/_14%),transparent_66%)]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            <Sparkles className="size-3" />
            Ship Studio — Early Access
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold tracking-tight sm:text-7xl">
            Your agents,{' '}
            <span className="text-primary">your rules.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Build once. Export to Claude Code, Gemini CLI, Codex, and Cursor — with MCP servers, skills, and permissions all in sync.
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

      {/* Live preview strip */}
      <section className="border-y border-border/60 bg-muted/30 px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Build once → export to
          </p>
          <div className="flex items-center justify-center gap-3">
            {PROVIDER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProvider(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeProvider === tab.id
                    ? 'border-primary/30 bg-primary/10 ' + tab.color
                    : 'border-border/60 bg-card text-muted-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-2.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Library config</p>
              </div>
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-foreground/80">{EXAMPLE_CONFIG}</pre>
            </div>
            <div className="overflow-hidden rounded-xl border border-primary/20 bg-card">
              <div className="border-b border-primary/20 bg-primary/5 px-4 py-2.5">
                <p className="text-[11px] font-medium text-primary uppercase tracking-wide">
                  Output — {activeProvider === 'claude' ? '.mcp.json + CLAUDE.md' : activeProvider === 'gemini' ? '.gemini/settings.json + GEMINI.md' : '.codex/config.toml + AGENTS.md'}
                </p>
              </div>
              <div className="p-4">
                <OutputPreview provider={activeProvider} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold sm:text-4xl">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Layers,
                step: '01',
                title: 'Build your library',
                description: 'Add MCP servers, skills, rules, and permissions in Ship Studio. Browse the curated catalog.',
              },
              {
                icon: Zap,
                step: '02',
                title: 'Configure your mode',
                description: 'Name your mode and choose which AI coding assistants to target. Configure permissions per provider.',
              },
              {
                icon: Bot,
                step: '03',
                title: 'Export everywhere',
                description: 'Download provider-native config files. Claude Code, Gemini CLI, and Codex all start with the same context.',
              },
            ].map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="relative rounded-2xl border border-border/60 bg-card p-6">
                <span className="mb-4 block font-display text-4xl font-bold text-primary/20">{step}</span>
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
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
          <p className="mb-6 text-muted-foreground">
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

function OutputPreview({ provider }: { provider: string }) {
  const outputs: Record<string, string> = {
    claude: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" }
    }
  }
}`,
    gemini: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "$GITHUB_TOKEN" }
    }
  },
  "theme": "Default"
}`,
    codex: `model: gpt-4o
mcpServers:
  github:
    command: npx
    args:
      - -y
      - "@modelcontextprotocol/server-github"
    env:
      GITHUB_TOKEN: $GITHUB_TOKEN`,
  }
  return (
    <pre className="overflow-x-auto text-xs leading-relaxed text-foreground/80">
      {outputs[provider]}
    </pre>
  )
}
