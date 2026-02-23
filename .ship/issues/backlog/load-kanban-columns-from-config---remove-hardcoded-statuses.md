+++
title = "Load kanban columns from config — remove hardcoded statuses"
created = "2026-02-23T03:05:49.486830426Z"
updated = "2026-02-23T03:05:49.486831426Z"
tags = []
links = []
+++

## Problem

`IssueList.tsx` and `STATUS_CONFIG` in `types.ts` hardcode 4 statuses: backlog, in-progress, blocked, done. Projects with a `review` column (default in config) or any custom status will never show those columns.

## Fix

Add a `get_project_config() -> ProjectConfig` Tauri command that returns the full project config including `statuses: Vec<StatusConfig>`.

Frontend changes:
- Load statuses on project open, store in App state
- Pass statuses to `IssueList` as a prop
- `IssueList` renders one column per status (order = config order)
- Color mapping driven from `StatusConfig.color` string (map color name → Tailwind class)
- Remove `STATUS_CONFIG` constant from `types.ts` and `IssueStatus` hardcoded union type

## Tauri command to add
```rust
#[tauri::command]
fn get_project_config(state: State<AppState>) -> Result<ProjectConfig, String> {
    let dir = get_active_dir(&state)?;
    get_config(&dir).map_err(|e| e.to_string())
}
```

## References
Spec: `ui-vision---production-roadmap.md` — Critical Bugs §3, Backend Hardening §3