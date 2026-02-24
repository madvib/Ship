+++
title = "ADR detail panel — view and edit existing ADRs"
created = "2026-02-23T03:06:29.469958954Z"
updated = "2026-02-23T05:03:09.445090Z"
tags = []
links = []
+++

## Problem

ADR cards are currently read-only with a 200-char truncation. There is no way to view the full decision body, edit it, or update the status.

## Tauri Commands Needed

```rust
#[tauri::command]
fn get_adr_cmd(file_name: String, state) -> Result<AdrEntry, String>

#[tauri::command]
fn update_adr_cmd(file_name: String, adr: AdrEntry, state) -> Result<(), String>
```

## Frontend — AdrDetail Panel

Same right-side slide-in pattern as `IssueDetail` (520px, backdrop blur).

Fields:
- **Title** (editable, large)
- **Status** (pill selector: proposed → accepted, rejected, superseded, deprecated)
- **Date** (display only)
- **Tags** (editable pills)
- **Spec reference** (editable text)
- **Body** (full markdown, edit/preview toggle — same pattern as issue description)

Actions:
- Save (if dirty)
- Delete (with confirm)

Update `AdrList` cards to be clickable and open this panel.
Update `types.ts` `ADR` interface to match actual `AdrMetadata` + `body` shape (coordinate with type misalignment issue).

## References
Spec: `ui-vision---production-roadmap.md` — View 4: ADR List + Detail

Implemented full ADR detail workflow in Tauri UI. Added backend commands get_adr_cmd, update_adr_cmd, and delete_adr_cmd in src-tauri; each resolves active project ADR paths and logs mutations. Added new AdrDetail right-panel component with editable title/status/tags/spec/body, markdown preview, keyboard shortcuts (Escape + Cmd/Ctrl+S), save and delete-confirm actions. Updated AdrList cards to be clickable and wired App state/handlers to open, refresh, save, and delete ADR entries.
