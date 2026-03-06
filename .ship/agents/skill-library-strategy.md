# Skill Library Strategy

## Goal

Use Agent Skills specification as the canonical format for project and published skills, then curate reusable skill packs for users.

## Source Inputs

- Spec: https://agentskills.io/specification
- Discovery/installation ecosystem: https://skills.sh
- Candidate published collections: `vercel-labs/agent-skills`, `evgyur/find-skills`

## Curation Model

1. Maintain a **core Ship skill pack** in `~/.ship/skills` for workflow-critical behavior.
2. Maintain an **approved external catalog** with source, version/ref, owner, and risk notes.
3. Import external skills into a `community/` namespace after review.
4. Prefer pinning installs to repo + ref for deterministic results.

## Acceptance Criteria For External Skills

- Follows Agent Skills spec exactly (`SKILL.md` frontmatter + structure).
- Clear purpose and trigger conditions.
- No unsafe shell behavior or hidden network side effects.
- Produces value in Shipwright workflows (Rust/runtime, React/Tauri, MCP, release hardening).

## Installation Workflow (skills.sh)

1. List candidates:
   - `npx skills add vercel-labs/agent-skills --list`
   - `npx skills find rust`
2. Install to specific agent(s):
   - `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a codex`
   - `npx skills add anthropics/skills --skill mcp-builder -a claude-code`
3. Validate and document imported skill metadata in project inventory.

## Governance

- Track imported skills in a manifest (source, ref, owner, review status).
- Revalidate on updates before promoting to default skill bundles.
- Keep project-critical behavior in first-party skills; use external skills for acceleration, not authority.
