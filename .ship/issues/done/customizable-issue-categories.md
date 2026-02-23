+++
id = "b2bae9d5-bd36-4610-8285-524838f1ee1b"
title = "Customizable Issue Categories"
created = "2026-02-22T05:30:30.879686102Z"
updated = "2026-02-22T05:30:30.879686976Z"
tags = []
links = []
+++

Allow users to define custom issue categories/statuses beyond the defaults, so workflows can be tailored to each project.

## Implementation — 2026-02-22

**Changed files:**
- `crates/logic/src/issue.rs` — `list_issues` / `list_issues_full` now scan `.ship/Issues/` subdirs dynamically; removed `ISSUE_STATUSES` dependency
- `crates/logic/src/project.rs` — renamed to `DEFAULT_STATUSES`, kept `ISSUE_STATUSES` alias
- `crates/logic/src/config.rs` — added `get_project_statuses`, `add_status`, `remove_status`
- `crates/logic/src/lib.rs` — exported new status functions
- `crates/cli/src/lib.rs` — `ship config status list|add|remove`
- `crates/mcp/src/lib.rs` — `list_statuses`, `add_status`, `remove_status` tools; replaced all `ISSUE_STATUSES` refs