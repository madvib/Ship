+++
id = "df3e5722-322b-40ba-8850-f62af4fe8c7a"
title = "Tauri IPC wrapper consolidation"
created = "2026-02-27T23:02:13.242412Z"
updated = "2026-02-27T23:02:24.262601Z"
tags = []
+++

Track migration from frontend invoke wrappers (crates/ui/src/lib/platform/tauri/commands.ts) to generated tauri-specta bindings (crates/ui/src/bindings.ts).

Why: avoid API drift and duplicate command definitions.

Acceptance:
- Replace manual wrappers with bindings.ts command calls in UI surface.
- Remove duplicate wrappers from commands.ts once no callsites remain.
- Keep error handling behavior consistent during migration.