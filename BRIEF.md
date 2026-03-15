# CLI Lane — Brief

## Read first
- `ARCHITECTURE.md` — platform principles, type definitions
- `SPEC.md` — config formats, `ship use` contract, lockfile format, skill format
- `TASKS.md` — full sprint board, cross-lane dependencies

## Objective
Make `ship init` and `ship use` work end-to-end, locally, with no account required.
A user should be able to: clone a repo → `ship init` → `ship use default` → see CLAUDE.md written.

## What already exists
`apps/ship-studio-cli/src/` has:
- `cli.rs` — full command surface already defined (Commands enum, args, flags)
- `main.rs` — dispatch wired, most commands stubbed with `stub()`
- `mode.rs` — `run_use()`, `run_modes()`, `run_compile_cmd()` — partially implemented
- `compile.rs` — compilation logic, calls WASM compiler
- `loader.rs` — reads `.ship/` and builds `ProjectLibrary` JSON
- `config.rs` — reads `~/.ship/config.toml` and `.ship/ship.toml`
- `paths.rs` — all path helpers (`project_ship_toml()`, `global_dir()`, etc.)
- `skill.rs` — skill subcommands, mostly stubbed

Read these files before writing any code. Understand what's implemented vs stubbed.

## Tasks — in priority order

### 0. `ship log <message>` — coordination primitive
File: `main.rs` → add `Log` to Commands enum
- Writes a timestamped note to `.ship/state/` (or prints to stdout if no project)
- Used by agents to signal progress across lanes without requiring ship-mcp running
- Shape: `ship log "ship init: scaffolding complete"` → appends to `.ship/coordination.log`
- Also: `ship log --unblocks web-import "import contract stable"` emits a tagged line
- Tiny scope: 30-40 lines. Do this first — coordination depends on it.

### 1. `ship init` (project)
File: `main.rs` → `run_init()`
Already partially implemented. Complete it:
- Scaffold `.ship/ship.toml` with `version`, `id` (nanoid), `name`, `providers`
- Scaffold `.ship/agents/rules/`, `.ship/agents/skills/`, `.ship/agents/presets/`
- Write `.gitignore` at project root adding: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.mcp.json`, `.cursor/`, `.codex/`, `.gemini/`, `.agents/skills/`, `.claude/skills/`
- Detect existing provider files (`CLAUDE.md`, `.mcp.json`, `.cursor/rules/`) and print import hint
- Print clear next step: `ship use <preset-id>`
- Idempotent — safe to run twice

### 2. `ship use <preset-id>` — local preset activation
File: `mode.rs` → `run_use()`
- Load preset from `.ship/agents/presets/<id>.toml` (project) or `~/.ship/presets/<id>.toml` (global)
- Build `ProjectLibrary` JSON via `loader.rs`
- Call compiler (already wired in `compile.rs`) → emit provider files
- Update `ship.toml` active_preset field
- Write `ship.lock` with installed artifacts (see SPEC.md lockfile format)
- Print: which preset activated, which files written, where

### 3. `ship use` (no args) — re-emit current preset
- Read active preset from `ship.toml`
- Same emit flow as above
- Error with actionable message if no active preset: "No preset active. Run: ship use <preset-id>"

### 4. `ship status`
Already partially implemented. Ensure it shows:
- Active preset id + version
- Providers configured
- Last compiled timestamp (from ship.lock or file mtime)
- Whether compiled files exist and are current

### 5. `ship import`
File: `main.rs` → currently `stub()`
- Scan project root for: `CLAUDE.md`, `.mcp.json`, `.cursor/rules/`, `AGENTS.md`, `.gemini/`
- Parse each into Ship primitives (rules → `agents/rules/`, MCP → `agents/mcp.toml`)
- Write a default preset at `.ship/agents/presets/default.toml` referencing imported content
- Print summary: what was found, what was written
- Do NOT delete the original files — user runs `ship use` after to confirm

## Constraints
- No network calls in this branch — all local filesystem
- No auth required for any of these commands
- `ship use` must work with a preset TOML file already on disk (no registry fetch yet)
- Exit nonzero + print actionable error on every failure path
- Tests required for `ship init` scaffolding and `ship use` emit logic

## Done when
```
mkdir test-project && cd test-project && git init
ship init
# → .ship/ scaffolded, .gitignore updated
ship use default
# → CLAUDE.md written at project root
ship status
# → shows active preset: default, last compiled: <timestamp>
```

## Branch
`feat/cli-init` — push frequently, PR to main when done
