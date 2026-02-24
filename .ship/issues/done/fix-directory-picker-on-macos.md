+++
id = "01c6f21a-588f-4635-b4e7-7f3b2d1581fb"
title = "Fix Directory Picker on macOS"
created = "2026-02-22T02:23:47.734478Z"
updated = "2026-02-23T05:18:50.562146Z"
tags = []
links = []
+++

Ensure the directory picker works correctly on macOS for project discovery.

Improved directory picker handling in Tauri commands to avoid nested .ship paths and normalize selected folders on macOS. set_active_project now normalizes root-or-.ship input, and pick/create project flows correctly handle selecting either project root or the .ship directory directly.
