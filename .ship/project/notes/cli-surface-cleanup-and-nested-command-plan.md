+++
id = "dd7093b2-d85c-4ff2-8c7e-83411bf2b16d"
title = "CLI surface cleanup and nested command plan"
created = "2026-02-27T00:23:12.451374Z"
updated = "2026-02-27T00:23:12.451374Z"
tags = []
+++

Summary: Keep default CLI focused for alpha. Hide internal-only commands (demo/migrate) and non-alpha commands (ghost/time) from main help while retaining direct invocation for internal workflows. Track a namespace-first command structure for post-alpha: project (release/adr/note), workflow (issue/spec/feature), agents (mode/skill). Prefer staged migration with compatibility aliases so existing scripts keep working.