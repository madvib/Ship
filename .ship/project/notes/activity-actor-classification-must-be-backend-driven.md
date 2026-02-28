+++
id = "d8400386-e1eb-4c65-b282-6153b8b55e26"
title = "Activity actor classification must be backend-driven"
created = "2026-02-28T06:10:32.673484Z"
updated = "2026-02-28T06:10:32.673484Z"
tags = []
+++

The Activity UI currently infers actor type from EventRecord.actor text via a frontend heuristic:
- empty/system/hook => system
- contains agent/mcp/ai => agent
- else => user

This is not authoritative and can mislabel events.

Required fix:
- Extend backend event schema with explicit actor_kind enum (user|agent|system).
- Emit actor_kind at write time in runtime/mcp/cli event paths.
- Update frontend activity view to render actor badges from actor_kind only (remove string matching heuristic).

Reason:
- Prevent incorrect attribution in activity stream and support reliable filtering/analytics.