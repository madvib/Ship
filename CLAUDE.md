# CLI Lane — feat/cli-init

Read `BRIEF.md` first. It contains the full task list, constraints, and done-when criteria.

## Key files
```
apps/ship-studio-cli/src/main.rs    — command dispatch, most commands stubbed
apps/ship-studio-cli/src/mode.rs    — run_use(), run_modes(), run_compile_cmd()
apps/ship-studio-cli/src/compile.rs — compilation logic
apps/ship-studio-cli/src/loader.rs  — reads .ship/ → ProjectLibrary JSON
apps/ship-studio-cli/src/config.rs  — reads ship.toml, ~/.ship/config.toml
apps/ship-studio-cli/src/paths.rs   — all path helpers
```

## Coordination
Use ship MCP (`log_progress`, `create_note`) at each milestone.
When your work unblocks another lane, `create_note` with title `[UNBLOCKS <lane>]`.

## Skills available
- Superpowers: brainstorm, TDD, systematic-debugging, writing-plans, executing-plans
- `.ship/agents/skills/ship-coordination.md` — coordination protocol

## Constraints from ARCHITECTURE.md
- CLI is a transport layer — business logic in `crates/core/runtime/`
- 300 line file cap — new modules require tests
- No backward-compat aliases — hard breaks only
- `ship use` is the sole activation verb
