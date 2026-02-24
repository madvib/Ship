# Ship (Alpha)

Ship is a local-first project memory and execution tool for software teams and AI agents.

For alpha, the focus is one loop:

`Chat -> Refine Spec -> Extract Issues -> Work Issues -> Update Issues -> Repeat`

## Alpha Scope

- Markdown documents with TOML frontmatter for issues, specs, and ADRs
- Local `.ship/` project state (no accounts, no cloud dependency)
- CLI for project setup and issue/ADR workflows
- MCP server over stdio (`ship mcp`) for agent access to project context
- Tauri UI under active development

## Quick Start

Initialize Ship in a repo:

```bash
ship init
```

List issues:

```bash
ship issue list
```

Create an issue:

```bash
ship issue create "Implement Kanban drag and drop" "Enable moving issue cards across columns."
```

Start MCP server (stdio):

```bash
ship mcp
```

## Core CLI Commands

```bash
ship init
ship issue create <title> <description>
ship issue list
ship issue move <file_name> <from_status> <to_status>
ship issue note <file_name> <note>
ship adr create <title>
ship projects
ship mcp
ship config
```

Run `ship --help` for the full command set.

## Project Structure

```text
.ship/
├── config.toml
├── templates/
├── issues/
│   ├── backlog/
│   ├── in-progress/
│   ├── review/
│   ├── done/
│   └── blocked/
├── specs/
├── adrs/
└── log.md
```

All `.ship` paths are lowercase.

## UI Development

From `crates/ui`:

```bash
pnpm install
pnpm build
pnpm dev
```

## Notes

- This repo is in alpha and evolves quickly.
- Source-of-truth product direction lives in `.ship/specs/alpha-spec.md`.
