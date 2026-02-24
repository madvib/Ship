+++
id = "d1950a49-95d5-4c65-980b-5e3fb139fdaa"
title = "Full settings UI — global config (user, MCP, appearance)"
created = "2026-02-23T03:07:00.603001738Z"
updated = "2026-02-23T05:57:57.570087Z"
tags = []
links = []
+++

## Global Settings Tabs

### User
- Name (text input)
- Email (text input)
- Saved to `~/.ship/config.toml` `[user]` section

### MCP
- See issue: "MCP sidecar auto-start + status indicator"
- Port: number input
- Enabled: toggle
- Connection status dot
- "Copy connection config" button

### Appearance
- Theme: Dark (only option for alpha — others greyed with "coming soon")
- Accent color: 6 preset swatches (blue, purple, emerald, amber, rose, zinc)
  - Applies by updating `--ship-accent` CSS variable at runtime
  - Persisted to global config

### Defaults
- Default issue status (dropdown, options from project config statuses)
- Default editor command (text: `code`, `nvim`, `cursor`, etc.)

## Tauri Commands

```rust
#[tauri::command]
fn get_global_config() -> Result<GlobalConfig, String>

#[tauri::command]  
fn save_global_config(config: GlobalConfig) -> Result<(), String>
```

`GlobalConfig` struct needs to be added/extended in the logic crate to hold user, defaults, mcp, ui sections matching `~/.ship/config.toml` spec.

## References
Spec: `ui-vision---production-roadmap.md` — View 5: Settings → Global

Implemented a tabbed Global settings UI with User (name/email), MCP (enabled + port), and Appearance/Defaults (theme, default status, editor). Added live theme preview with cancel rollback and persisted global settings to local storage for rapid iteration stability. Theme/default/editor controls are now integrated with the active project status options.
