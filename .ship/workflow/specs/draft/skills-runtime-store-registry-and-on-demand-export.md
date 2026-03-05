+++
id = "skills-runtime-store-registry"
title = "Skills Runtime Store, Registry, and On-Demand Export"
status = "draft"
created = "2026-03-04T00:00:00Z"
updated = "2026-03-04T00:00:00Z"
author = "ship"
tags = ["skills", "runtime", "sqlite", "security", "agent-config"]
+++

## Overview

Ship currently treats project-local skill folders as the primary source for skill availability. This creates duplication across projects, weak provenance tracking, and no durable trust model for script-capable skills.

This spec defines a SQLite-aware skills architecture with:

- a deduplicated artifact store outside git,
- explicit registry metadata (source/provenance/trust),
- project-scoped skill bindings for mode composition,
- and provider config generation on demand from active runtime state.

## Goals

- Support custom skill creation from MCP/UI with durable metadata.
- Support skill installation from marketplaces (skills.sh) with explicit untrusted defaults.
- Seed default first-party skills (`ship-workflow`, `skill-creator`) on `ship init`.
- Support both global and project skill scopes without duplicating payloads across projects.
- Generate provider skill config on demand from active mode/runtime state.
- Enforce safe defaults for script-capable skills.

## Non-Goals

- Implement full remote signature infrastructure in v1.
- Add a UI for trust policy management in this phase.
- Remove file-based export formats expected by external providers.

## Requirements

1. Skills are stored outside repo git history by default.
2. Registry must track provenance (`source_type`, `source_uri`, version/ref, hash).
3. Modes (project scope) attach skills by stable IDs from SQLite, not file paths.
4. Script-capable marketplace skills default to untrusted execution policy.
5. Provider config export resolves skills at export time from active mode.

## Proposed Storage Model

### Artifact Store (deduplicated payloads)

- Base path: `~/.ship/skills/store/<sha256>/`
- Skill payload is stored once per unique content hash.
- Payload includes `SKILL.md` and optional subdirs (`scripts/`, `references/`, `assets/`, `agents/`).

### Global Registry (metadata)

Store canonical skill metadata in global SQLite:

- `skill_uuid` (stable id)
- `name`
- `version` (optional)
- `sha256`
- `source_type` (`builtin`, `marketplace`, `git`, `local`)
- `source_uri`
- `source_ref`
- `artifact_path`
- `scripts_present` (bool)
- `trust_level` (`trusted`, `untrusted`)
- `created_at`, `updated_at`

### Project Bindings (selection)

Store project-level enablement in project SQLite:

- `project_skill_binding(project_id, skill_uuid, enabled, pin_version, installed_via, created_at)`
- `mode_skill_binding(mode_id, skill_uuid, ord, enabled)`

Modes remain project-scoped; registry entries are global and reusable across projects.

## Runtime Resolution

### Effective Skill Set

For project `P` and active mode `M`:

1. Load enabled project skill bindings.
2. Resolve bound `skill_uuid` rows from global registry.
3. If mode has explicit skill filters, intersect with mode bindings.
4. Exclude untrusted script-enabled skills from executable paths unless explicitly allowed.

### On-Demand Provider Export

`ship config export` / runtime sync:

1. Resolve effective skill set for active mode.
2. Materialize provider-specific skill directories/files only for selected skills.
3. Remove stale Ship-managed exported skills not in current resolved set.

No static “always-export-all-skills” behavior.

## Install and Creation Flows

### Custom Skill Creation (MCP/UI)

1. Author skill content in UI/MCP.
2. Compute hash and write payload to artifact store.
3. Upsert global registry row.
4. Create project binding in current project.

Default scope: project binding with global artifact reuse.

### Marketplace Install (skills.sh, CLI)

1. Download package.
2. Validate format and compute hash.
3. Store payload in artifact store.
4. Register global metadata with provenance.
5. Create project binding.
6. If `scripts/` present, mark `trust_level = untrusted` and print warning.

### Project Init

On `ship init`:

1. Ensure builtin registry entries exist for `ship-workflow` and `skill-creator`.
2. Bind both to the project by default.
3. Do not copy skill payload into repo workspace.

## Security Model

- `scripts_present = true` marketplace skills default to `trust_level = untrusted`.
- Untrusted scripts are not executed by runtime export/sync flows.
- Trust escalation is explicit (future command/UI): `ship skill trust <skill_uuid>`.
- Registry hash is used to detect tampering/drift between expected and installed content.

## Migration Plan

1. Introduce registry and binding tables.
2. Scan existing project skill folders and import to global registry/artifact store.
3. Create project bindings for imported skills.
4. Keep compatibility reads temporarily, but make DB bindings canonical for mode/export.
5. Deprecate repo-local skills as runtime source.

## Acceptance Criteria

- [ ] `ship init` binds `ship-workflow` and `skill-creator` without copying payloads into repo.
- [ ] Creating a skill from MCP/UI writes artifact + registry + project binding.
- [ ] Installing from skills.sh creates binding and warns/marks untrusted when scripts exist.
- [ ] Modes reference `skill_uuid` bindings (project scope), not file names.
- [ ] Export resolves skills from active mode/bindings on demand.
- [ ] Registry stores provenance and hash for installed skills.
- [ ] A single installed skill payload can be shared across multiple projects.

## Open Questions

- Should trust be per skill globally, per project, or both (global default + project override)?
- Should first-party builtin skills be immutable or updateable in place?
- Do we require lockfiles (`skills.lock`) for reproducible CI exports in this phase?
