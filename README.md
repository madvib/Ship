# Ship

**Declarative project management for AI agents.**

Ship defines what your software is supposed to be — and keeps it that way. Features are declared states, not tasks. Agents work toward them. Drift closes automatically.


[getship.dev](https://getship.dev) · [Early Access](#early-access) · [Status: Alpha](#status)
<img width="1312" height="1082" alt="Overview" src="https://github.com/user-attachments/assets/305d658a-0220-43ad-9521-a0582e59013c" />
## The Problem

Every agent session starts cold. Your agent doesn't know what the system is supposed to do, what decisions shaped it, what constraints apply, or what changed in the last session. You compensate by pasting context into every prompt, maintaining mental models of what the agent already "knows," and watching agents make the same mistakes across sessions.

This isn't a prompting problem. It's a structural one.

Task-oriented tools — issues, tickets, PRs — describe the steps to get somewhere. They have no model of where you're actually trying to go. When agents execute tasks faster than humans can track, intent erodes. The system becomes an archaeological site. You excavate it to understand it.

Ship fixes this at the foundation.

---

## The Approach

A feature in Ship is not a task. It's a **declaration of desired system state** — what the software should do, how it should behave, and what the acceptance criteria are. Tests are sensors that measure the gap between declared and actual. Documentation reflects runtime behavior automatically.

After every agent session, Ship runs hooks that close the drift between declared state and actual state. The system always knows what it's supposed to be and how far reality has drifted from that.

**This is the missing primitive.** Not faster task execution — continuous verification of intent.

```
Vision → Capability Map → Features (declared states)
                               ↓
                    Workspaces (agent environments)
                               ↓
                    Sessions (execution + audit)
                               ↓
                    Drift measurement (post-session hooks)
                               ↓
                    Feature stays true to declaration
```

---

## What Ship Does

### Compiles intent into agent configuration

Ship detects your installed providers — Claude Code, Gemini CLI, Codex — and compiles the right configuration for each automatically. Not dotfiles you maintain by hand. Structured declarations that generate the correct native format for each provider, on demand, scoped to the active workspace.

```
ship providers connect claude
# → detects Claude Code installation
# → compiles context from active feature declaration
# → writes CLAUDE.md + .mcp.json scoped to this workspace
# → agent starts with complete, accurate context
```

### Scopes agents to exactly what they need

Every workspace has a compiled configuration: which MCP tools are allowed, which files can be touched, which skills apply, which rules are enforced. A TypeScript specialist doesn't see auth service internals. An auth agent gets the security MCP server and nothing else. Narrow context + deep expertise beats broad context every time.

```toml
# Compiled per workspace, per provider, per session
[workspace.auth-feature]
skills = ["auth-specialist", "security-audit"]
mcp_servers = ["auth-mcp", "vault-mcp"]
permissions.deny = ["Bash(rm -rf *)", "Bash(git reset --hard)"]
allowed_paths = ["src/auth/**", "tests/auth/**"]
```

### Enforces security at the runtime level

Permissions are enforced by the Ship runtime — not by asking the agent to behave. An agent cannot bypass Ship's permission policy even if instructed to. Allow/deny patterns, filesystem restrictions, command blocklists: all compiled into every session before the agent receives its first prompt.

### Surfaces decisions, not just diffs

Architectural decisions live as first-class records linked to the features they shaped. When an agent works on a feature, it has access to every decision that constrained its design — not because you pasted it in, but because Ship compiled it into the context automatically. New engineers and new agents onboard into the same model.

### Keeps the system honest

Post-session hooks run after every workspace session. Tests execute against the feature declaration. Documentation updates to reflect runtime behavior. Drift is measured, surfaced, and routed — to a human if a decision is needed, or closed automatically if the system is converging correctly.

---

## How It Works

Ship lives in your repository as a `.ship/` directory — structured, versioned, git-native. A desktop app (macOS/Windows) provides the full planning and execution interface. A CLI and MCP server give agents and scripts direct access to the project model.

### Branch checkout triggers context injection

```bash
git checkout feature/payments-v2
# → Ship reads the feature declaration linked to this branch
# → Compiles CLAUDE.md with: feature spec + decisions + skills + rules
# → Writes .mcp.json with servers declared for this feature
# → Writes provider configs for all connected agents
# → Agent opens the project with complete, scoped context
```

### Feature declarations are structured contracts

```toml
# .ship/project/features/payments-v2.md
id = "f3a7c291"
title = "Payments v2 — Stripe Connect"
status = "in-progress"
release_id = "8b2d4e10"
branch = "feature/payments-v2"

[agent]
skills = ["payment-compliance", "stripe-specialist"]
mcp_servers = ["stripe-docs", "vault-mcp"]
```
<img width="1634" height="1082" alt="Screenshot 2026-03-10 at 10 31 39 PM" src="https://github.com/user-attachments/assets/378fc7ec-ff6a-4e7c-80bc-6890fd6398ce" />

### Multi-provider compilation, native formats

Ship knows how each agent tool works. It writes configuration in the format each provider actually reads:

| Provider | Context file | MCP config | Skills |
|---|---|---|---|
| Claude Code | `CLAUDE.md` | `.mcp.json` | `.claude/skills/<id>/SKILL.md` |
| Gemini CLI | `GEMINI.md` | `.gemini/settings.json` | `.gemini/skills/<id>/SKILL.md` |
| Codex CLI | `AGENTS.md` | `.codex/config.toml` | `.agents/skills/<id>/SKILL.md` |

### MCP server — agents as first-class consumers

Ship runs as an MCP server, giving agents structured read/write access to the entire project model: features, releases, decisions, skills, providers, session records. Agents use typed tools, not file access.

```bash
ship mcp  # stdio transport, works with any MCP-compatible agent
```

40+ tools including `get_project_info`, `create_feature`, `list_providers`, `git_feature_sync`, and more.

### Sessions run inside Ship

The runtime console is built into every workspace. Start a session, pick a provider, and the agent runs inside Ship's controlled environment — permissions enforced, context already compiled, session tracked from first token to last commit. No context switching. No separate terminal.

The session record captures what the agent read, what it changed, what decisions it made, and where it asked for human input. The audit trail is automatic.

<img width="1634" height="1082" alt="Screenshot 2026-03-10 at 10 53 13 PM" src="https://github.com/user-attachments/assets/eb394b60-e5d2-4e66-8d45-bc9f1cd41a26" />

---

## Quick Start

```bash
# Install (requires Rust)
cargo install --path crates/cli

# Initialize in your repo
ship init
# → detects installed providers automatically
# → installs git hooks
# → creates .ship/ structure

# Create a feature
ship feature create "User authentication"

# Connect a provider
ship providers connect claude

# Check provider status
ship providers list
# ID       NAME          INSTALLED  CONNECTED  STATUS
# claude   Claude Code   yes        yes        ready
# gemini   Gemini CLI    yes        no         —
# codex    Codex CLI     yes        yes        ready

# Sync agent context for current branch
ship git sync
```

---

## Project Structure

```
.ship/
├── ship.toml                 # project config, providers, git policy
├── project/
│   ├── vision.md             # project vision and long-term intent
│   ├── features/             # feature declarations (committed)
│   ├── releases/             # release targets (committed)
│   └── adrs/                 # architecture decisions (committed)
└── agents/
    ├── skills/               # reusable agent configurations (SDK format)
    ├── rules/                # always-on instructions, compiled into every session
    └── modes/                # named agent configurations (Code, Planning, Review...)
```

**Git policy** — decisions and declarations are committed (features, releases, ADRs, vision). Execution state is local by default (session records, notes, events). Override per-category in `ship.toml`.

---

## Architecture

Ship is a Rust monorepo:

| Crate | Role |
|---|---|
| `core/runtime` | Core data model, CRUD, event stream, agent config resolution |
| `crates/cli` | `ship` binary — workflow CLI |
| `crates/mcp` | `ship-mcp` binary — MCP stdio server |
| `crates/modules/git` | Git hook handler, context compilation |
| `crates/ui` | Tauri + React desktop app (macOS/Windows) |

- **Storage:** SQLite as canonical store — markdown exported as agent-readable context, not source of truth
- **Events:** Append-only event stream — the replication unit for cloud sync
- **Config resolution:** Project defaults → active mode → feature-level overrides, consistent across CLI, MCP, and desktop
- **Transport:** MCP over stdio today; HTTP/SSE for editor integrations post-alpha
- **Security:** Permission policies enforced at runtime — agents cannot bypass even if instructed

---

## Status

Ship is in **alpha**. It is used to build itself — this repo runs Ship on every branch.

**Working now:**
- Full CRUD for features, releases, decisions, notes, skills, rules
- Git hook → context compilation for Claude Code, Gemini CLI, Codex
- MCP server with 40+ tools
- Provider detection, connect/disconnect, live health checks
- Granular MCP tool filtering — enable half an MCP server, scoped per workspace
- Permission policy engine with allow/deny patterns
- Desktop app (macOS) — workspace management, session execution, feature tracking
- SQLite workspace state with branch-scoped context
- 180+ passing tests including end-to-end branch lifecycle tests

**In progress:**
- Session record model — immutable audit log replacing spec artifacts
- HTTP/SSE transport for Cursor and Windsurf
- Post-session drift measurement hooks
- Cloud sync via event log replication

---

## Why Now

The MCP protocol standardized how agents consume external context. Every major AI coding tool — Claude Code, Gemini CLI, Codex, Cursor, Windsurf — now supports it. The tooling layer has arrived.

What's missing is the intent layer above it: structured declarations of what the system should be, compiled automatically into agent configuration, continuously verified against actual behavior.

Declarative infrastructure won everywhere else. Terraform over bash scripts. Kubernetes over manual deploys. Ship is declarative infrastructure for the software development process itself.

---

## Early Access

Ship is not yet publicly available. If you're building seriously with agents and hitting the context and coherence ceiling, [join the waitlist at getship.dev](https://getship.dev) or reach out directly.

This repo is public so you can see how Ship works — and because Ship is used to build itself. The `.ship/` directory in this repo is live.

---

*Built with Ship · Rust · TypeScript · MCP · Local-first*
