+++
title = "Full settings UI — project config (statuses, tags, git, templates)"
created = "2026-02-23T03:06:52.777235079Z"
updated = "2026-02-23T03:06:52.777235879Z"
tags = []
links = []
+++

## Why

The current settings panel has 3 fields. The alpha spec requires a full GUI for `.ship/config.toml` so users never need to hand-edit TOML.

## Tauri Commands Needed

`get_project_config` and `save_project_config` (update existing `get_app_settings` / `save_app_settings` to use `ProjectConfig` not the minimal `Config` struct).

## Project Settings Tabs

### Statuses
- Drag-to-reorder list (use `@dnd-kit/sortable`)
- Each row: drag handle | color swatch | id (monospace) | display name | delete button
- "Add Status" inline form: id (auto-slug from name), name, color (8 preset swatches)
- Cannot delete a status with issues in it — show issue count, disable delete
- Calls `add_status` / `remove_status` logic functions

### Tags
- Same CRUD list pattern as statuses
- id (e.g. `priority:high`), display name, color

### Git
- Two-column layout or toggle per row:
  - issues ✓ committed | logs ✗ ignored | specs ✓ | adrs ✓ | config ✓ | templates ✓
- Inline description of what each means: "Committing issues means your project history is in git."
- Calls `set_category_committed` via Tauri

### Templates
- Three side-by-side cards: ISSUE | SPEC | ADR
- Each has a monospace textarea showing current template content
- "Reset to default" per template
- Auto-save on blur

## References
Spec: `ui-vision---production-roadmap.md` — View 5: Settings → Project