+++
id = "bb00283e-65c9-487e-a1da-95c6fbb4fa2f"
title = "MCP sidecar auto-start + status indicator in settings"
created = "2026-02-23T03:06:39.761994897Z"
updated = "2026-02-23T03:06:39.761995897Z"
tags = []
links = []
+++

## Why

Alpha done criterion #7: "Open Claude Desktop or Cursor, connect to Ship's MCP server." Currently users must manually run `ship-mcp` in a terminal. The Tauri app should start it automatically.

## Implementation

### tauri.conf.json
Configure `ship-mcp` as a Tauri sidecar:
```json
{
  "plugins": {
    "shell": {
      "sidecar": true,
      "scope": [{ "name": "ship-mcp", "sidecar": true }]
    }
  }
}
```

Bundle the `ship-mcp` binary as a sidecar in the Tauri build.

### Tauri Commands
```rust
#[tauri::command]
async fn mcp_start(app: AppHandle) -> Result<(), String>

#[tauri::command]
async fn mcp_stop(app: AppHandle) -> Result<(), String>

#[tauri::command]
fn mcp_status() -> MpcStatus // { running: bool, port: u16, pid: Option<u32> }
```

Auto-start in `setup` hook: spawn sidecar, store `Child` handle in state. Kill on app exit.

### Settings UI
Global Settings → MCP tab:
- Green/red dot: connection status (poll `mcp_status` every 5s)
- Port number (default 7700, editable — requires restart)
- "Copy connection config" button: copies the JSON snippet users paste into Claude Desktop / Cursor / Windsurf MCP config
- Manual start/stop buttons (for troubleshooting)

### Connection config snippet
```json
{
  "mcpServers": {
    "ship": {
      "command": "/path/to/ship-mcp",
      "env": { "SHIP_DIR": "/path/to/project/.ship" }
    }
  }
}
```

## References
Spec: `ui-vision---production-roadmap.md` — Backend Hardening §6