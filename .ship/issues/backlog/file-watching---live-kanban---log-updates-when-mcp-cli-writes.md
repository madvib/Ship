+++
id = "f2e1f61f-0d66-436f-b92a-ed8827121012"
title = "File watching — live kanban + log updates when MCP/CLI writes"
created = "2026-02-23T03:05:56.843174957Z"
updated = "2026-02-23T03:05:56.843176157Z"
tags = []
links = []
+++

## Why This Matters

Alpha done criterion #9: "Agent updates an issue — change appears in the Kanban board." Without file watching, the UI is stale the moment any external process (MCP server, CLI) touches the project.

## Implementation

Add `notify` crate to `crates/ui/src-tauri/Cargo.toml`.

Watch paths:
- `.ship/issues/**/*.md` → emit `ship://issues-changed` Tauri event
- `.ship/log.md` → emit `ship://log-changed` Tauri event
- `.ship/config.toml` → emit `ship://config-changed` Tauri event

Set up watcher on `set_active_project` / `detect_current_project`. Replace old watcher on project switch.

Frontend:
```typescript
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten1 = listen('ship://issues-changed', () => loadIssues());
  const unlisten2 = listen('ship://log-changed', () => loadLog());
  const unlisten3 = listen('ship://config-changed', () => loadConfig());
  return () => { unlisten1.then(f => f()); unlisten2.then(f => f()); unlisten3.then(f => f()); };
}, [activeProject]);
```

Debounce events by 200ms to avoid thrashing on rapid writes.

## References
Spec: `ui-vision---production-roadmap.md` — Backend Hardening §2