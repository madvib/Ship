+++
title = "Fix UI project handling and add global state"
created = "2026-02-23T03:57:02Z"
updated = "2026-02-23T04:00:00Z"
tags = ["ui", "tauri", "bugfix"]
links = []
+++

## Description

Fixed several critical UI issues for better project management:

- Filtered out .Trash and system directories from project discovery
- Added global state persistence for active project (~/.ship/app_state.json)
- Projects now persist across app restarts
- Added New Project button with folder picker dialog
- Fixed ADR and AdrEntry serialization for Tauri IPC

## Resolution

Changes made:
1. `logic/src/config.rs` - Filter system directories in `discover_projects()`
2. `logic/src/project.rs` - Added global app state persistence functions
3. `logic/src/adr.rs` - Added Serialize/Deserialize to ADR and AdrEntry
4. `ui/src-tauri/src/lib.rs` - Updated commands to use global state
5. `ui/src/App.tsx` - Load persisted project on startup
6. `ui/src/components/Sidebar.tsx` - Added New Project button

All code compiles and Tauri dev mode works correctly.

## Tasks
- [x] Filter invalid projects from discovery
- [x] Add global state persistence
- [x] Fix Tauri IPC serialization
- [x] Add New Project dialog

## Links
-
