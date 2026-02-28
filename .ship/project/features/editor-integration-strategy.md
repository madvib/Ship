# Shipwright — Editor Integration Strategy

**Last Updated:** 2026-02-26

---

## The Architecture

Shipwright is a standalone application — its own window, its own process, its own UI. It is not a panel inside an editor. This is a deliberate product decision that makes Shipwright editor-agnostic and gives it a surface area that no editor extension can match.

The integration with editors happens at two levels:

**Level 1 — URI links (no extension required).** Every editor that registers an OS-level URI scheme can be opened to a specific file and line from anywhere — a Shipwright issue card, a spec document, a log entry. This works today, requires nothing installed, and covers 90% of what developers actually want from editor integration.

**Level 2 — The minimal extension (lightweight launcher + status).** A thin VS Code extension (and equivalents for Zed, JetBrains, etc.) that does three things: registers a URI handler, shows Shipwright status in the status bar, and opens the Shipwright window on demand. No UI rendering inside the editor. No webview panels. The extension is a bridge to the standalone app, not a replacement for it.

This separation is intentional and defensible. The Shipwright UI is built once, runs everywhere. The extension is a few hundred lines that ships via marketplace. When Shipwright gains new features, the extension doesn't need to change — the standalone app already has them.

---

## Level 1 — URI Links

### How It Works

Every major editor registers a URI scheme at the OS level on install. Shipwright constructs the appropriate URI based on the user's configured editor and renders it as a clickable link anywhere in the UI.

```
Editor         Scheme          Example
────────────────────────────────────────────────────────────────────────
VS Code        vscode://       vscode://file/Users/alex/project/src/auth.ts:42:8
VS Code        vscode-insiders vscode-insiders://file/...
Zed            zed://          zed://file/Users/alex/project/src/auth.ts:42
Cursor         cursor://       cursor://file/Users/alex/project/src/auth.ts:42
Windsurf       windsurf://     windsurf://file/...
JetBrains      idea://         idea://open?file=/Users/alex/project/src/auth.ts&line=42
Neovim         nvim://         handled via nvim --remote +42 /path/to/file (CLI, not URI)
Sublime        subl://         subl://open?url=file:///path&line=42
```

The URI is constructed in the Rust backend, not the frontend — the backend knows the project root, the file path, and which editor is configured. The frontend renders an anchor tag with `href={uri}` and the OS handles the rest.

### Editor Configuration

```jsonc
// ~/.ship/config.jsonc
{
  "defaults": {
    "editor": "code"
    // "code" | "code-insiders" | "cursor" | "windsurf" | "zed" |
    // "idea" | "webstorm" | "clion" | "subl" | "nvim" | "vim"
  }
}
```

The editor field drives URI scheme selection. Schema publishes valid values — autocomplete in any editor.

For remote SSH setups (a developer working on a remote server), the URI includes the remote host:

```
vscode://vscode-remote/ssh-remote+user@host/path/to/file.ts:42
```

This is the same pattern Vibe Kanban uses for their remote SSH feature — Shipwright should support it identically.

### Where Links Appear in the UI

Every surface that references a file gets a link. This is a systematic requirement — if a document references a file, it renders as a clickable link.

**Issue cards and detail panel:**
- "Open in editor" button — opens the issue file itself
- Any file path mentioned in the issue description — auto-linked
- "Go to implementation" — if the issue has a `file` frontmatter field

**Spec editor:**
- File references in spec body — auto-linked
- "Open spec file in editor" button in header

**ADR detail:**
- File references in context/decision/consequences sections — auto-linked

**Log entries:**
- File paths in log entries — auto-linked
- Agent-created file references — auto-linked

**Branch context panel:**
- Linked spec — opens spec file in editor
- Open issues — each links to issue file
- Generated CLAUDE.md — opens in editor for inspection

**Worktree panel:**
- "Open worktree in editor" — opens the worktree root
- Each linked file — opens at that file

### URI Construction — Rust

```rust
pub fn build_editor_uri(
    editor: &EditorKind,
    path: &Path,
    line: Option<u32>,
    col: Option<u32>,
    remote_host: Option<&str>,
) -> String {
    match editor {
        EditorKind::VSCode | EditorKind::VSCodeInsiders | EditorKind::Cursor | EditorKind::Windsurf => {
            let scheme = editor.uri_scheme();
            if let Some(host) = remote_host {
                format!("{}://vscode-remote/ssh-remote+{}{}", scheme, host, path.display())
            } else {
                let loc = match (line, col) {
                    (Some(l), Some(c)) => format!("{}:{}:{}", path.display(), l, c),
                    (Some(l), None)    => format!("{}:{}", path.display(), l),
                    _                  => path.display().to_string(),
                };
                format!("{}://file/{}", scheme, loc)
            }
        }
        EditorKind::Zed => {
            let loc = match line {
                Some(l) => format!("{}:{}", path.display(), l),
                None    => path.display().to_string(),
            };
            format!("zed://file/{}", loc)
        }
        EditorKind::Idea | EditorKind::WebStorm | EditorKind::CLion => {
            let mut url = format!("idea://open?file={}", path.display());
            if let Some(l) = line { url.push_str(&format!("&line={}", l)); }
            url
        }
        EditorKind::Neovim | EditorKind::Vim => {
            // No URI scheme — fall back to CLI invocation via shell
            // `nvim --remote-silent +{line} {path}` via Tauri shell
            format!("__cli__nvim --remote-silent +{} {}", line.unwrap_or(1), path.display())
        }
        EditorKind::Sublime => {
            format!("subl://open?url=file://{}&line={}", path.display(), line.unwrap_or(1))
        }
    }
}
```

For Neovim/Vim, the frontend detects the `__cli__` prefix and uses Tauri's shell API to spawn the command instead of opening a URI.

### Tauri Command

```rust
#[tauri::command]
fn open_in_editor(path: String, line: Option<u32>, col: Option<u32>) -> Result<(), String> {
    let config = get_global_config()?;
    let uri = build_editor_uri(&config.defaults.editor, Path::new(&path), line, col, config.remote_ssh_host.as_deref());

    if uri.starts_with("__cli__") {
        // Neovim/Vim path
        let cmd = uri.trim_start_matches("__cli__");
        std::process::Command::new("sh").arg("-c").arg(cmd).spawn()
            .map_err(|e| e.to_string())?;
    } else {
        // URI scheme path
        opener::open(&uri).map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

---

## Level 2 — The Minimal Extension

### Philosophy

The extension does three things and nothing else:

1. **URI handler** — registers `shipwright://` so external tools can open Shipwright to a specific view
2. **Status bar item** — shows MCP status and active mode at a glance
3. **Launch command** — opens the Shipwright window if not already running

The Shipwright UI lives in the standalone window. The extension is a thin bridge. No webview panels, no duplicated UI, no maintenance burden.

### VS Code Extension — Full Implementation

```typescript
// extension.ts
import * as vscode from 'vscode';
import { execSync, spawn } from 'child_process';
import * as http from 'http';

const SHIPWRIGHT_PORT_DEFAULT = 7700;

export function activate(context: vscode.ExtensionContext) {

  // ── Status bar ──────────────────────────────────────────────────────────────

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left, 100
  );
  statusBar.command = 'shipwright.open';
  statusBar.tooltip = 'Shipwright — click to open';
  context.subscriptions.push(statusBar);

  function updateStatus(state: 'running' | 'stopped' | 'unknown', mode?: string) {
    switch (state) {
      case 'running':
        statusBar.text = `$(circle-filled) Ship${mode ? ` · ${mode}` : ''}`;
        statusBar.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        break;
      case 'stopped':
        statusBar.text = `$(circle-outline) Ship`;
        statusBar.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        break;
      case 'unknown':
        statusBar.text = `$(circle-slash) Ship`;
        statusBar.color = undefined;
        break;
    }
    statusBar.show();
  }

  // Poll MCP status every 10s
  async function pollStatus() {
    const port = vscode.workspace.getConfiguration('shipwright').get<number>('port', SHIPWRIGHT_PORT_DEFAULT);
    try {
      const status = await fetchStatus(port);
      updateStatus('running', status.activeMode);
    } catch {
      updateStatus('stopped');
    }
  }

  pollStatus();
  const poller = setInterval(pollStatus, 10_000);
  context.subscriptions.push({ dispose: () => clearInterval(poller) });

  // ── URI handler — shipwright://open?view=issues&id=issue-001 ────────────────

  const uriHandler = vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      const params = new URLSearchParams(uri.query);
      const view = params.get('view');
      const id = params.get('id');

      // Forward to running Shipwright instance via HTTP
      const port = vscode.workspace.getConfiguration('shipwright').get<number>('port', SHIPWRIGHT_PORT_DEFAULT);
      openInShipwright(port, view, id);
    }
  });
  context.subscriptions.push(uriHandler);

  // ── Commands ─────────────────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand('shipwright.open', async () => {
      const port = vscode.workspace.getConfiguration('shipwright').get<number>('port', SHIPWRIGHT_PORT_DEFAULT);
      const launched = await ensureRunning(port);
      if (!launched) {
        vscode.window.showErrorMessage(
          'Shipwright is not running. Install it from shipwright.dev',
          'Download'
        ).then(action => {
          if (action === 'Download') {
            vscode.env.openExternal(vscode.Uri.parse('https://shipwright.dev/download'));
          }
        });
      }
    }),

    vscode.commands.registerCommand('shipwright.openIssues', () => {
      navigateTo('issues');
    }),

    vscode.commands.registerCommand('shipwright.openSpecs', () => {
      navigateTo('specs');
    }),

    vscode.commands.registerCommand('shipwright.newIssue', () => {
      navigateTo('issues/new');
    }),

    vscode.commands.registerCommand('shipwright.openCurrentBranchContext', () => {
      navigateTo('agents/branch-context');
    }),
  );

  // ── Workspace recommendation ──────────────────────────────────────────────
  // If .ship/ exists in workspace, show a prompt to open Shipwright

  const watcher = vscode.workspace.createFileSystemWatcher('**/.ship/project/project.jsonc');
  watcher.onDidCreate(() => {
    vscode.window.showInformationMessage(
      'Shipwright project detected.',
      'Open Shipwright'
    ).then(action => {
      if (action === 'Open Shipwright') {
        vscode.commands.executeCommand('shipwright.open');
      }
    });
  });
  context.subscriptions.push(watcher);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fetchStatus(port: number): Promise<{ activeMode: string; mcpRunning: boolean }> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/api/status`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function openInShipwright(port: number, view: string | null, id: string | null) {
  const path = [view, id].filter(Boolean).join('/');
  http.get(`http://127.0.0.1:${port}/api/navigate?to=${encodeURIComponent(path)}`);
}

function navigateTo(view: string) {
  const port = vscode.workspace.getConfiguration('shipwright').get<number>('port', SHIPWRIGHT_PORT_DEFAULT);
  openInShipwright(port, view, null);
}

async function ensureRunning(port: number): Promise<boolean> {
  try {
    await fetchStatus(port);
    return true;
  } catch {
    return false; // Let user launch manually — don't auto-spawn
  }
}

export function deactivate() {}
```

### package.json (Extension Manifest)

```jsonc
{
  "name": "shipwright",
  "displayName": "Shipwright",
  "description": "Project memory for software teams — open Shipwright from VS Code",
  "version": "0.1.0",
  "publisher": "shipwright",
  "categories": ["Other"],
  "activationEvents": [
    "workspaceContains:.ship/project/project.jsonc"
  ],
  "contributes": {
    "commands": [
      {
        "command": "shipwright.open",
        "title": "Shipwright: Open"
      },
      {
        "command": "shipwright.openIssues",
        "title": "Shipwright: Open Issues"
      },
      {
        "command": "shipwright.newIssue",
        "title": "Shipwright: New Issue"
      },
      {
        "command": "shipwright.openCurrentBranchContext",
        "title": "Shipwright: View Branch Context"
      }
    ],
    "configuration": {
      "title": "Shipwright",
      "properties": {
        "shipwright.port": {
          "type": "number",
          "default": 7700,
          "description": "Port the Shipwright MCP server is running on"
        }
      }
    },
    "uriHandler": true
  },
  "engines": { "vscode": "^1.85.0" }
}
```

### The `shipwright://` URI Scheme

Shipwright exposes its own URI scheme for deep-linking into views from anywhere — git commit messages, CI output, Slack messages, README badges, email notifications.

```
shipwright://open                            → open Shipwright (any view)
shipwright://open?view=issues                → open issues kanban
shipwright://open?view=issues&id=issue-001   → open specific issue
shipwright://open?view=specs&id=spec-023     → open specific spec
shipwright://open?view=agents/branch-context → open branch context panel
shipwright://open?view=log                   → open log
```

The extension registers this handler with VS Code. When clicked from anywhere in the editor environment — a terminal link, a comment, a README — VS Code intercepts it and forwards to the Shipwright window.

Outside VS Code (browser, terminal, other apps) the handler is registered at the OS level by the Shipwright app itself on first launch.

---

## Distribution Strategy

### The Extensions.json Angle

`ship init` writes a VS Code workspace recommendation into `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "shipwright.shipwright"
  ]
}
```

This file is committed to git. Every developer who clones the repo and opens it in VS Code gets a prompt: "This workspace has extension recommendations. Install?" One click installs the Shipwright extension. The extension detects `.ship/project/project.jsonc`, prompts to open Shipwright, the developer downloads the app.

**This is passive viral distribution built into `ship init`.** One developer on a team adopts Shipwright and every teammate gets the prompt automatically.

### Marketplace Presence

The extension description in the VS Code marketplace leads with the use case, not the technology:

> "Shipwright gives your AI agents persistent project memory. Issues, specs, decisions, and branch context — all in your repo, all version-controlled, all automatically loaded into every agent session."

The extension itself is the discovery mechanism. Developers searching for AI agent tooling, MCP servers, or project management find the extension. The extension downloads lead to the app downloads.

### Editor Coverage

| Editor | Method | Status |
|--------|--------|--------|
| VS Code | Extension (marketplace) | Alpha |
| Cursor | VS Code extension works directly | Alpha |
| Windsurf | VS Code extension works directly | Alpha |
| Zed | Native Zed extension | V1 |
| JetBrains | Plugin (marketplace) | V1 |
| Neovim | Lua plugin | V2 |

Cursor and Windsurf both support VS Code extensions natively — one extension covers three editors. Zed has its own extension API which is worth targeting given the demographic overlap with Shipwright's core user.

---

## The Navigation API

The Shipwright backend exposes a minimal HTTP API that the extension and URI handler use to drive the UI. This is not a full REST API — it's a handful of endpoints for navigation and status.

```
GET  /api/status              → { activeMode, mcpRunning, projectName, branchContext }
GET  /api/navigate?to=<path>  → navigate the Shipwright window to a view
```

The `navigate` endpoint accepts the same path strings as the `shipwright://` URI scheme. The Tauri window receives this via an internal event and updates the router. The window is brought to focus on navigate.

```rust
// In the Tauri app — listens for navigation requests from the HTTP API
tauri::async_runtime::spawn(async move {
    let app_handle = app.clone();
    // Tiny axum server on loopback for extension communication
    let router = Router::new()
        .route("/api/status", get(handle_status))
        .route("/api/navigate", get(move |Query(params): Query<NavParams>| {
            let handle = app_handle.clone();
            async move {
                handle.emit_all("navigate", &params.to).ok();
                handle.get_window("main").map(|w| w.set_focus().ok());
                Json(json!({ "ok": true }))
            }
        }));
    axum::Server::bind(&"127.0.0.1:7700".parse().unwrap())
        .serve(router.into_make_service())
        .await
        .unwrap();
});
```

The MCP server and this navigation API share the same port (7700 default). The MCP server runs on a subpath or the same handler routes by content-type. One port, two concerns.
