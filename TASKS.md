# Ship — Active Task Board

> Coordination doc for parallel agent work. Each task has an owner branch prefix.
> Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## Day 1 — Foundation (branch prefix: `foundation/`)

- [x] Disable Ship MCP (old workflow layer)
- [x] Archive apps/cli/ → archive/cli-v0
- [x] Archive apps/desktop/, apps/site/, crates/plugins/, examples/, docs/, crates/modules/git/
- [x] Clean rules + memory (remove old workflow references)
- [x] Write ARCHITECTURE.md, SPEC.md, TASKS.md
- [x] Fix Cargo workspace — remove archived members
- [x] Rename ship-studio-cli binary to `ship`
- [x] Trim MCP to platform-only tools
- [x] Remove stale git hooks
- [x] Rewrite ~/.ship/skills to remove workflow-layer references
- [x] Clean state pushed to main
- [x] Devcontainer + rust-toolchain.toml
- [x] Vite+ / oxlint toolchain wired up

## Day 2 — Auth + Persistence (branch prefix: `feat/auth-`)

- [ ] Better Auth: user accounts, email+password + OAuth (GitHub)
- [ ] D1 schema: users, libraries, presets
- [ ] Library save/load API (POST /api/library, GET /api/library/:id)
- [ ] "Save Library" button in Studio (requires auth)
- [ ] "My Libraries" page (list saved libraries)

## Day 3 — Sharing + Registry Read (branch prefix: `feat/registry-`)

- [ ] Public library URL: `/l/:id` — shareable, no auth required to view
- [ ] "Open in Studio" from shared URL
- [ ] Public preset registry browse (read-only, free tier)
- [ ] Registry search + filter in Studio sidebar

## Day 4 — CLI Story (branch prefix: `feat/cli-`)

- [ ] `ship init` — initialize .ship/ in project
- [ ] `ship use <preset-id>` — install preset from registry, compile output
- [ ] `ship compile` — recompile current preset to provider files
- [ ] `ship workspace create/activate/list` (platform primitives)
- [ ] `ship session start/log/end` (platform primitives)

## Day 5 — Workflow Authoring MVP (branch prefix: `feat/workflow-`)

- [ ] WorkflowDefinition schema (WORKFLOW.toml format)
- [ ] Workflow authoring UI in Studio (build from presets)
- [ ] "Save Workflow" requires account (first paid gate)
- [ ] Basic workflow list/detail pages

## Week 2 — Payments + Polish

- [ ] Stripe integration (subscription: free / pro)
- [ ] Pricing page on web
- [ ] Onboarding flow (post-signup)
- [ ] Private library gate (pro only)
- [ ] Private registry gate (pro only)

## Week 3 — Workflow Execution

- [ ] `ship run <workflow>` — CLI workflow executor
- [ ] Session tracking for workflow runs
- [ ] Basic analytics (session outcomes per workflow)

## Week 4 — Launch

- [ ] Landing page polish
- [ ] First marketing push
- [ ] First paid customer

---

## Worktree conventions for parallel agents

```bash
# Create a worktree for a task
git worktree add ../ship-<task> -b <branch-prefix>/<task-name>

# Each agent works in its own worktree
# Merge back to main when done
# Naming: feat/auth-accounts, feat/registry-browse, foundation/cli-rename
```

## Files agents should read first
1. `ARCHITECTURE.md` — what we're building, platform/workflow separation
2. `TASKS.md` (this file) — what's being worked on
3. `.ship/agents/rules/` — engineering standards
