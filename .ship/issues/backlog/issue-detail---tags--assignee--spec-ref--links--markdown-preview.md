+++
title = "Issue detail — tags, assignee, spec ref, links, markdown preview"
created = "2026-02-23T03:07:11.305465559Z"
updated = "2026-02-23T03:07:11.305466459Z"
tags = []
links = []
+++

## Current State

`IssueDetail.tsx` shows: title (editable textarea), meta (date + filename), description (large textarea), status chips, save/delete. It does not show or allow editing of tags, assignee, spec reference, or links — even though these fields exist in `IssueMetadata`.

## Required Changes

### IssueDetail panel additions:
1. **Tags** — editable pill list. Click pill to remove. Type in input to add. Show tag suggestions from project config on focus.
2. **Assignee** — single inline text field. Shows initials avatar when populated.
3. **Spec reference** — inline text field (freetext for alpha). Shows as a linked pill when populated.
4. **Links** — list of typed relationships. Each link: type selector (`blocks` / `blocked-by` / `relates-to`) + target filename. "Add link" opens a small inline form.
5. **Description** — add an edit/preview toggle. Render markdown in preview mode (use a lightweight renderer — `marked` or `@uiw/react-md-editor` minimal).

### Keyboard
- `Escape` closes panel
- `Cmd+S` / `Ctrl+S` saves

### Auto-save
- Save on status change immediately (already works)
- Debounced auto-save on title/description change (2s), removes need for explicit Save button in most flows — keep Save button for clarity

## Update Tauri command
`update_issue_by_path` must pass all `IssueMetadata` fields through, not just title/description. Coordinate with type misalignment issue.

## References
Spec: `ui-vision---production-roadmap.md` — View 2: Issue Detail Panel