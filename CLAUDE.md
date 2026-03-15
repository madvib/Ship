# Server Lane — feat/server-auth

Read `BRIEF.md` first. It contains the full task list, constraints, and done-when criteria.

## Key files
```
apps/web/src/lib/auth.ts              — Better Auth instance (stubbed, email only)
apps/web/src/lib/auth-client.ts       — client-side auth client
apps/web/src/routes/api/auth/$.ts     — catch-all route (returns 404, needs wiring)
apps/web/wrangler.jsonc               — Cloudflare bindings
apps/web/src/features/compiler/types.ts — ProjectLibrary type (import returns this)
```

## Skills — read before implementing
- `.ship/agents/skills/better-auth.md` — D1 adapter, GitHub OAuth, schema, route wiring
- `.ship/agents/skills/tanstack-start.md` — API route patterns, server functions, CF bindings

## Coordination
Use ship MCP (`log_progress`, `create_note`) at each milestone.
When `/api/github/import` contract is stable, `create_note` with `[UNBLOCKS web-import]`
and include the exact request/response shape.

## Skills available
- Superpowers: brainstorm, TDD, systematic-debugging, writing-plans, executing-plans
- `.ship/agents/skills/ship-coordination.md` — coordination protocol

## Constraints
- No R2 in this brief — registry lane handles that
- GitHub App OAuth (repo write) is separate — this brief covers user identity only
- D1 is SQLite — no JSON operators, no arrays, flat schema
- All secrets via env bindings, never hardcoded
- Cloudflare Workers: no Node built-ins (`fs`, `path`), use `globalThis.crypto`
