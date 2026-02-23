+++
title = "Specs section — list view + split-pane editor with AI chat"
created = "2026-02-23T03:06:21.624960191Z"
updated = "2026-02-23T03:06:21.624960691Z"
tags = []
links = []
+++

## Why

Specs are the PRIMARY document type in Ship. The spec editor with AI chat is the signature feature. Currently the UI has no specs section at all.

## Tauri Commands Needed

```rust
#[tauri::command]
fn list_specs_cmd(state) -> Result<Vec<SpecEntry>, String>

#[tauri::command]  
fn get_spec_cmd(file_name: String, state) -> Result<String, String>

#[tauri::command]
fn create_spec_cmd(title: String, state) -> Result<SpecEntry, String>

#[tauri::command]
fn update_spec_cmd(file_name: String, content: String, state) -> Result<(), String>
```

(Logic functions already exist in `logic/src/spec.rs`)

## Frontend — List View

Add `specs` to `NavSection` type. New `SpecList` component:
- Table: title | last updated | status
- "New Spec" button → creates spec + opens editor
- Click row → opens `SpecEditor`

## Frontend — SpecEditor Component

Split pane layout (resizable, default 60/40):

**Left — Markdown editor:**
- Frontmatter form (collapsible): title, status (draft/active/archived), author, tags
- Textarea editor with toolbar: H1, H2, bold, italic, code block, bullet list
- Auto-save on blur (debounced 1s)
- Word count in footer

**Right — AI Chat Panel:**
- Header: "Refine with AI" + collapse toggle
- Chat message thread (user messages right-aligned, AI left-aligned)
- Markdown rendering in AI responses
- Multiline input, Cmd+Enter to send
- AI has full spec content as context
- "Extract Issues" button (top of panel, prominent):
  - Calls `generate_issue_description` for each extracted item OR a dedicated `extract_issues` tool
  - Shows modal: list of suggested issues with checkboxes and editable titles/descriptions
  - "Create Selected" creates them all, shows confirmation
- "Draft ADR" button: calls `generate_adr`, pre-populates New ADR modal

**When right panel collapsed:** editor takes full width, small "AI ✦" button in toolbar to re-open.

## Empty State
"Specs are living documents. Start with a rough idea — refine it with AI — extract issues."

## References
Spec: `ui-vision---production-roadmap.md` — View 3: Specs