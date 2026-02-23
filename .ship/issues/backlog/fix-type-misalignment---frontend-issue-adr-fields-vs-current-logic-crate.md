+++
id = "02344037-baf0-4b3f-8e59-bb2eeacc8a92"
title = "Fix type misalignment — frontend Issue/ADR fields vs current logic crate"
created = "2026-02-23T03:05:37.528518678Z"
updated = "2026-02-23T03:05:37.528519878Z"
tags = []
links = []
+++

## Problem

`types.ts` is out of sync with the current Rust logic crate after the TOML migration. This causes silent data loss in the UI (blank timestamps, missing fields).

## Changes Required

### types.ts
```typescript
export interface Issue {
  title: string;
  description: string;
  assignee: string;
  tags: string[];
  spec: string;
  created: string;   // was created_at
  updated: string;   // was updated_at
  links: IssueLink[];
}

export interface IssueLink {
  type: string;
  target: string;
}
```

Remove `ADR.decision` — the logic crate `ADR` struct has `body: String` and `metadata: AdrMetadata { title, status, date, tags, spec }`. Update `AdrEntry` and `AdrList` display accordingly.

### Tauri commands
Audit each Tauri command in `src-tauri/src/lib.rs` against the current logic crate API:
- `create_new_issue` — pass `assignee` and `tags` fields
- `create_new_adr` — use current `AdrMetadata` struct shape
- `list_adrs_cmd` — verify returned data shape matches frontend `AdrEntry`
- All field names consistent with `IssueMetadata` (`created`/`updated` not `created_at`/`updated_at`)

## References
Spec: `ui-vision---production-roadmap.md` — Critical Bugs §2 and §4