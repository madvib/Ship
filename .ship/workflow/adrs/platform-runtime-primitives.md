# ADR: Ship as Workflow Infrastructure Layer

**Status:** Accepted
**Date:** 2026-03-15
**Replaces:** Previous "Ship opinionated workflow" architecture

---

## Context

Ship started as an opinionated project workflow tool — plan, work, wrap up, with Ship-prescribed structure throughout. We built a compiler, a desktop app, a CLI, an MCP server, and a Studio. The tools are good. The prescription is the problem.

We want gstack, superpowers, and teams with their own workflow culture to adopt Ship. They won't adopt a workflow OS that tells them how to work. They will adopt infrastructure that makes their existing workflow better.

The pivot: Ship becomes the layer. Workflows run on top.

---

## Decision

### Ship provides four runtime primitives

**1. Control — Agent Configuration**
The compiler + hook system gives any workflow full ownership of how AI agents behave. Compile once to all providers. Hook into agent lifecycle events. No workflow has to fight the agent to enforce behavior — they register through Ship and get cross-provider enforcement for free.

**2. Planning Documents**
Notes and ADRs are the minimum any team needs. Specs, features, and releases are optional structure built on top. Workflows can define their own document types. Ship stores them, versions them, and makes them available to agents via the MCP server.

**3. Audits and Visibility**
Session logs. Test results. What happened, when, with what outcome. Ship writes structured logs to `.ship/logs/`. Workflows can read and annotate them. The MCP server exposes them to agents. This is how you know if a workflow is working.

**4. Analysis**
Measure effectiveness. What worked, which agents performed better, what to work on next. Built on top of the audit layer. Premium tier — not required for the platform to function.

Orchestration (task runners, parallel agents, delegation chains) is *bonus* — not a primitive. We don't build it until someone needs it.

---

## Workflow Package Format

A workflow package is a self-contained bundle:

```
my-workflow/
├── WORKFLOW.toml        # manifest: name, hooks, requirements, skills
├── skills/              # agent instruction files (SKILL.md per skill)
├── hooks/               # hook implementations (shell scripts or binaries)
│   ├── session-start.sh
│   └── session-end.sh
└── docs/                # workflow documentation for agents
    └── guide.md
```

**WORKFLOW.toml:**
```toml
[workflow]
id = "gstack"
name = "gStack Workflow"
version = "1.0.0"
description = "CEO-level execution framework for software teams"
homepage = "https://github.com/garrytan/gstack"

[[hooks]]
event = "session_start"
command = "./hooks/session-start.sh"

[[hooks]]
event = "session_end"
command = "./hooks/session-end.sh"

[[skills]]
ref = "./skills/plan-ceo-review"

[[skills]]
ref = "./skills/execution-loop"
```

Install: `ship workflow add gstack`
The workflow's skills get compiled into the agent context automatically. Its hooks register with Ship's runtime. The user configures once; all providers get it.

---

## Hook Execution Model

### Phase 1 (current): Shell commands with injected context

Hooks are shell scripts. Ship injects session context as environment variables before executing:

```bash
SHIP_SESSION_ID=ses_abc123
SHIP_PROJECT_PATH=/home/user/my-app
SHIP_ACTIVE_MODE=gstack-mode
SHIP_PROVIDER=claude
SHIP_FEATURE_ID=feat_xyz          # null if no active feature
SHIP_WORKSPACE_ID=ws_abc          # null if no active workspace
```

Hooks communicate back to Ship by calling CLI commands:

```bash
# Block the current operation with a reason
ship hook block "No active feature — run 'ship feature create' first"

# Surface a suggestion without blocking
ship hook suggest "Consider logging progress before wrapping up"

# Write to the session log
ship hook log "session_start" '{"mode": "gstack", "feature": "auth-refactor"}'

# Read current state
ship state get feature.current
```

This means gstack's hooks are just bash scripts that call `ship`. No SDK dependency. Maximum portability.

### Phase 2 (future): Direct SDK integration

For workflows that need lower-latency or richer state access, a Rust/WASM SDK will expose the same interface without shell overhead. MIT licensed. Same interface as Phase 1 — hooks that work via CLI will work via SDK with no changes.

---

## Shipflow Positioning

Shipflow is Ship's reference workflow. It demonstrates what the platform can do. It is:

- **Declarative** — define goals and constraints; the workflow figures out the steps
- **First-party** — maintained by the Ship team, showcases primitives
- **Not privileged** — same SDK as gstack, same WORKFLOW.toml format, same install story

`ship workflow add shipflow` is the onboarding path for teams that want a ready-made workflow. Teams like gstack's users who already have a workflow use `ship workflow add gstack`.

The goal is that Shipflow competes on quality, not access.

---

## Desktop App Repositioning

The Tauri app is the **local workflow runtime host**. Its job:

1. Run background processes for installed workflows (MCP servers, hook listeners)
2. Provide the Studio UI (config, composing modes, library)
3. Surface session logs and audit data
4. Eventually: docs primitives, process orchestration, team sync

What it does NOT do: prescribe a workflow. It hosts whatever workflow packages are installed. If gstack is installed, the desktop surfaces gstack's UI components. If Shipflow is installed, it surfaces Shipflow's planning interface. The desktop is neutral infrastructure.

---

## Existing Code Strategy

The existing codebase is an **archive and parts library**, not a codebase to refactor.

**Keep wholesale:**
- `crates/core/compiler` — platform foundation, unchanged by pivot
- `packages/compiler` (WASM build) — core Studio dependency
- `apps/web` (Studio) — visual layer, needs Workflows tab added
- `crates/mcp` (ship-mcp) — unchanged, exposes planning docs to agents

**Harvest types and patterns:**
- `crates/core/runtime` — data models, reuse for new runtime
- `apps/ship-studio-cli` — CLI surface is right, harvest commands

**Rebuild with new framing:**
- Desktop app content (keep Tauri shell, replace workflow-specific UI)
- Hook execution model (extend current `[[hooks]]` TOML)
- `ship workflow` commands (new, not in current CLI)

---

## Dogfood Milestones

Getting Ship running on Ship is the fastest validation loop.

**M1 — Agent control:** `ship-studio compile` generates our CLAUDE.md/GEMINI.md from `.ship/agents/`. We use our own tool for our own agent config. (Compiler exists — needs wiring.)

**M2 — Session logging:** Ship writes structured session logs to `.ship/logs/YYYY-MM-DD/session-<id>.jsonl`. We can see what work happened and when.

**M3 — Shipflow v0.1:** A minimal workflow package installable via `ship workflow add shipflow`. Hooks for session_start and session_end. Uses existing Note/ADR primitives. We use it on this repo.

**M4 — External integration:** `ship workflow add gstack` works. Garry's hooks register. His skills get compiled. Shared dogfood.

---

## Consequences

**Positive:**
- Ship's value proposition is additive, not prescriptive — lower adoption friction
- Workflow authors (gstack, superpowers) are our distribution channel
- Compiler and Studio become more valuable as more workflows integrate
- Moat: the more workflows that run on Ship, the more valuable the platform becomes

**Risks:**
- Slower revenue path than opinionated workflow (more steps to value)
- Hook SDK quality directly affects partner trust — must be excellent
- If we don't ship Shipflow, we have no reference implementation to show partners

**Mitigations:**
- Dogfood M1-M3 aggressively — we need our own workflow before asking anyone else to build one
- Hook SDK goes MIT from day one — removes trust barrier
- Studio stays free and functional — acquisition funnel doesn't depend on workflow adoption
