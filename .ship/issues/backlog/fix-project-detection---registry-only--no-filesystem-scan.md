+++
id = "2b5066a4-01cf-447e-ab1e-b949ebb59ea2"
title = "Fix project detection — registry only, no filesystem scan"
created = "2026-02-23T03:05:30.049237197Z"
updated = "2026-02-23T03:05:30.049238097Z"
tags = []
links = []
+++

## Problem

`list_projects` in `src-tauri/src/lib.rs` scans the filesystem for `.ship` directories, finding them in `.Trash`, temp dirs, and other system paths. This populates the project switcher with garbage entries.

## Fix

Projects must come from `~/.ship/registry.toml` (the `ProjectRegistry`) only. Remove filesystem discovery scanning.

- `list_projects` Tauri command → calls `load_registry()`, returns registry projects
- `pick_and_open_project` → after folder picker, call `register_project()` to persist it to registry, then set as active. Currently only sets in-memory `active_project`.
- `detect_current_project` → check if CWD is inside a registered project path; fall back to checking if CWD has a `.ship` dir (and register it if found)
- Remove any code that walks the filesystem looking for `.ship` directories

## References
Spec: `ui-vision---production-roadmap.md` — Critical Bugs §1