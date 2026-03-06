+++
id = "KVVaSUTx"
title = "Pre-defined Agent Modes"
created = "2026-02-28T15:56:07Z"
updated = "2026-03-05T02:32:14.520116+00:00"
release_id = "v0.1.0-alpha"
spec_id = ""
branch = ""
tags = []

[agent]
model = "claude"
max_cost_per_session = 10.0
mcp_servers = []
skills = []
+++


## Why

Developers working across planning, implementation, and configuration need deterministic agent behavior changes when mode changes. A mode is only useful if it actually constrains tools and triggers immediate context/export sync to the active agent(s).

## Acceptance Criteria

- [x] At least three built-in modes seeded on init: Planning, Code, Config
- [x] Mode definitions persist in SQLite (`agent_mode`) and are not duplicated in `ship.toml`
- [x] `ship mode set <id>` recompiles effective agent configuration and syncs to active provider targets
- [x] If mode `target_agents` is empty, sync falls back to connected providers (`config.providers`) before defaulting to Claude
- [x] Feature `[agent]` overrides apply on top of active mode (filter semantics)
- [x] Custom modes can be created/removed via CLI (`ship mode add/remove`)
- [ ] MCP tools for mode management (`list_modes`, `set_mode`)
- [ ] UI mode switcher that displays current mode and what it configures

## Delivery Todos

- [x] Seed default modes with practical tool scopes (`planning`, `code`, `config`)
- [x] Keep mode storage canonical in SQLite and loaded through runtime config APIs
- [x] Trigger `sync_active_mode` from `set_active_mode`
- [x] Harden sync target resolution (normalize, dedupe, skip unknown targets)
- [x] Add fallback sync behavior to connected providers when mode targets are empty
- [x] Add tests for mode sync behavior and provider fallback
- [ ] Enforce `active_tools` at MCP call boundary so mode tool restrictions are hard gates
- [ ] Add MCP mode-management tools and tests
- [ ] Add UI mode management surface and tests

## Notes

Modes are an execution control plane, not PM status. The runtime path now guarantees that mode changes propagate to exported agent config for connected providers.

Current built-in defaults:
- Planning: planning/spec/issue authoring tools
- Code: implementation + issue/spec update tools + feature sync
- Config: skill/provider/git-config/hook tooling

## Current State

Completed in runtime/module code:
- Built-in mode seeding on init (`planning`, `code`, `config`)
- Mode persistence in SQLite (`agent_mode`) via config read/write paths
- Mode-aware filtering for skills/rules/MCP in resolved agent config
- Mode-change sync wired through `set_active_mode`
- Sync target fallback improved: mode targets -> connected providers -> `claude`

Remaining:
- MCP `list_modes` / `set_mode` tool exposure
- UI mode switcher + mode detail surface
- Strict runtime enforcement of `active_tools` at MCP tool invocation layer