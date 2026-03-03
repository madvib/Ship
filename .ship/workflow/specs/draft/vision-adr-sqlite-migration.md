+++
id = "zjgzbjzu"
title = "ADR: SQLite Migration + Full Lifecycle"
created = "2026-03-02T21:23:41.686948+00:00"
updated = "2026-03-02T21:31:00+00:00"
author = ""
tags = []
+++

# ADR: SQLite Migration + Full Lifecycle

## Summary

Migrate the **Vision** document and **ADR** entities from markdown-as-source-of-truth to SQLite as canonical store, with markdown as a committed export for git. This is the first entity migration in the SQLite-first data model rollout.

## Scope

### Vision

Vision is a singleton document per project. Currently lives at `.ship/project/VISION.md` with TOML frontmatter + markdown body. It is the one document that **stays in git** (per the SQLite-first ADR), so it keeps existing as a committed file. The migration here is:

- SQLite stores `title`, `updated_at`, and `body` as columns for fast read/search
- The committed `VISION.md` file is kept in sync on every write (write-through cache pattern)
- `get_vision` reads from SQLite; falls back to file if DB row does not exist (migration path)
- `update_vision` writes to SQLite **and** rewrites the committed `.ship/project/VISION.md`

### ADRs

ADRs currently live in `.ship/project/adrs/{status}/{slug}.md`. Per the SQLite-first ADR, structured entities move to SQLite. However, **accepted ADRs are committed to git** as human-authored records. The migration:

- SQLite is the canonical store for all ADR fields: `id`, `title`, `status`, `date`, `body`, `tags`, `spec_id`, `supersedes_id`, `created_at`, `updated_at`
- On create/update/move, the committed markdown file is regenerated (write-through for accepted ADRs)
- `list_adrs` reads from SQLite
- `get_adr` reads from SQLite by ID; file path is derived for backward compat but not the source of truth
- Migration on first run: scan `.ship/project/adrs/` and INSERT any files not yet in DB

## SQLite Schema (additions to `state_db.rs`)

```sql
-- Migration: 0004_vision
CREATE TABLE IF NOT EXISTS vision (
  id       TEXT PRIMARY KEY DEFAULT 'singleton',
  title    TEXT NOT NULL DEFAULT 'Vision',
  body     TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

-- Migration: 0005_adrs
CREATE TABLE IF NOT EXISTS adr (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'proposed',
  date         TEXT NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  tags_json    TEXT NOT NULL DEFAULT '[]',
  spec_id      TEXT,
  supersedes_id TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS adr_status_idx ON adr(status);
```

## Files to Change

### Runtime crate (`crates/runtime/src/`)

- **`state_db.rs`** — add migrations `0004_vision` and `0005_adrs`; add CRUD helpers: `get_vision_db`, `upsert_vision_db`, `list_adrs_db`, `get_adr_db`, `upsert_adr_db`, `delete_adr_db`, `move_adr_db`
- **`vision.rs`** — rewrite `get_vision` (SQLite-first, file fallback) and `update_vision` (write-through to SQLite + file)
- **`adr.rs`** — rewrite CRUD to use SQLite; keep `to_markdown`/`from_markdown` for file export only; add `import_adrs_from_files` for migration

### MCP crate (`crates/mcp/src/`)

ADRs are exposed as **MCP resources**, not CRUD tools:
- `ship://adrs` — list of all ADRs (id, title, status)
- `ship://adr/{id}` — full ADR body by id

**Net-new tool:**
- `update_adr` — updates title, body, tags, spec_id by id; `status` field is excluded from the input schema and rejected if passed — MCP can never promote an ADR to `accepted`

**Unchanged:** `create_adr` (always creates as `proposed`), `generate_adr` (AI)

Decompose 2k-line `lib.rs` into `tools/{issues,adrs,specs,features,releases,notes,skills,project,ai,git,time}.rs` + `request_types.rs`.

### Tauri crate (`crates/ui/src-tauri/src/lib.rs`)

Switch ADR commands from path/filename-based to ID-based. Add `move_adr_cmd`. Status transitions (including → accepted) are Tauri/CLI only — never MCP.

## Git-committed Files

- ADR files in `accepted/` → **committed** (write-through on move-to-accepted)
- Other status folders → **gitignored** (local working state)

## Migration Path

`import_adrs_from_files(ship_dir)` — scans `.ship/project/adrs/**/*.md`, inserts missing rows (ON CONFLICT IGNORE, idempotent). The 7 existing accepted ADRs import automatically.

## Acceptance Criteria

- [ ] `adr` table + status index in project DB
- [ ] `list_adrs` reads from SQLite (no filesystem walk)
- [ ] `create_adr` / `update_adr` / `delete_adr` / `move_adr` all write to SQLite
- [ ] Accepted ADR `.md` regenerated on create or move-to-accepted
- [ ] `import_adrs_from_files` is idempotent
- [ ] MCP `update_adr` rejects any `status` field — `accepted` transitions are Tauri/CLI only
- [ ] ADRs readable as MCP resources (`ship://adrs`, `ship://adr/{id}`)
- [ ] Tauri ADR commands use ID-based API
- [ ] UI lifecycle: list by status, create, detail panel, transition controls (UI only)
- [ ] No Rust source file exceeds 500 lines
- [ ] All existing runtime tests pass
