# vibe-cli

AI-assisted project tracking and feature development CLI.

## Features

- **Project Tracking**: Manage Issues and Architecture Decision Records (ADRs) directly in your repository under the `.project/` directory.
- **MCP Server**: Built-in Model Context Protocol server for AI agents to interact with your project state.
- **Web Dashboard**: Visual dashboard to view project progress, ADRs, and logs.
- **Customizable Templates**: Eject and customize Markdown templates for Issues and ADRs.
- **Agent Logging**: Every action performed by an agent via MCP is logged for transparency.

## Installation

```bash
npm install -g vibe-cli
```

## Quick Start

Initialize project tracking in your repo:

```bash
vibe project init
```

Start the Web UI:

```bash
vibe project ui
```

Start the MCP server:

```bash
vibe project mcp
```

## Commands

- `vibe issue create <title>`: Create a new issue.
- `vibe issue move <file> <from> <to>`: Move issue status.
- `vibe adr create <title>`: Create a new ADR.
- `vibe project link <source> <target>`: Link two items together.
- `vibe project eject-templates`: Customize templates.

## Directory Structure

```
.project/
├── ADR/           # Architecture Decision Records
├── Issues/        # Issues categorized by status
│   ├── backlog/
│   ├── in-progress/
│   ├── done/
│   └── blocked/
├── templates/     # Customizable Markdown templates
├── log.md         # History of agent actions
└── README.md      # Project tracking overview
```
