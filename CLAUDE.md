# Web Lane — feat/web-import

Read `BRIEF.md` first. It contains the full task list, constraints, and done-when criteria.

## Key files — read these fully before writing any code
```
apps/web/src/routes/studio.tsx                    — full compiler Studio UI
apps/web/src/features/compiler/useCompiler.ts     — ProjectLibrary state
apps/web/src/features/compiler/types.ts           — ProjectLibrary + all types
apps/web/src/routes/index.tsx                     — landing page
apps/web/src/lib/auth-client.ts                   — Better Auth client (stubbed)
```

## Skills — read before implementing
- `.ship/agents/skills/tanstack-start.md` — route patterns, mutations, Query
- `.ship/agents/skills/better-auth.md` — auth client, useSession hook
- `.ship/agents/skills/ship-coordination.md` — coordination protocol

## Coordination
Use ship MCP (`log_progress`, `create_note`) at each milestone.
Watch for `[UNBLOCKS web-import]` note from server lane — that's when to swap mock for real endpoint.

## Skills available
- Superpowers: brainstorm, TDD, systematic-debugging, writing-plans, executing-plans
- Frontend-design: production-grade UI, distinctive aesthetics

## Constraints from BRIEF.md
- No new UI libraries — use `@ship/primitives` components
- Import works unauthenticated — never require login for core flow
- Mock the server endpoint cleanly — easy to swap
- No new routes — import lives within Studio + landing page
- Read `studio.tsx` and `useCompiler.ts` FULLY before building
