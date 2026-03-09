---
name: start-session
description: Define or refine a concrete spec, ensure workspace links are correct, and launch a tracked workspace session with the right goal/provider/mode. Use this when users ask to "start a session" but the spec or workspace context is incomplete.
---

# Start Session

Use this skill when the user wants to begin execution and needs orchestration across spec, workspace, and session setup.

## Use this skill when

- The user asks to start working but the spec is missing, vague, or stale.
- The user asks to "bootstrap" a session from feature intent.
- The user asks for a guided start flow that ends in an active session.

## Session mode clarification

- Session mode is the runtime mode profile (`mode_id`) used for this session.
- It controls provider/tool/rules resolution through workspace context compilation.
- If none is provided, use workspace active mode, then project active mode.

## Orchestration flow

1. Resolve target workspace branch (or create/select one if missing).
2. Gather spec intent:
  - problem statement
  - scope boundaries
  - acceptance criteria
  - risks/constraints
3. Create or update spec with concise, testable content.
4. Ensure workspace links are correct (`feature_id`, `spec_id`, optional `release_id`).
5. Resolve provider and mode for the workspace.
6. Start session with explicit goal and selected provider/mode.
7. Return session ID + workspace/spec linkage summary.

## Goal template

Use this shape when setting `goal`:

- `Implement <capability> for <user outcome>; validate with <acceptance criteria summary>.`

## Guardrails

- Do not start a session without a concrete goal unless user explicitly requests minimal mode.
- Do not fabricate link IDs; use discovered IDs or create them first.
- Keep spec acceptance criteria measurable.
- If provider resolution is empty, stop and fix workspace/provider config before starting.

## Output contract

When complete, report:

1. Workspace branch + mode/provider used
2. Spec ID created/updated
3. Linked feature/spec/release IDs
4. Session ID and active status
