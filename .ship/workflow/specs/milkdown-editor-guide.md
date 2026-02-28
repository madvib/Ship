# Shipwright — Milkdown Editor Guide

**Last Updated:** 2026-02-26

---

## Architecture Overview

The Shipwright editor is Milkdown with three layers on top:

- **Frontmatter** — stripped before Milkdown sees the document, handled by a dedicated React form, reattached on save
- **Title node** — a custom ProseMirror node that is the document's first block, synced to the filename
- **Slash commands** — a custom slash menu with Shipwright-specific, AI, and standard insert categories

Milkdown always sees a clean markdown body. It never sees `+++` frontmatter blocks or the title as a separate input field.

---

## Frontmatter

### The Approach

Strip frontmatter before it reaches Milkdown. Handle it in a purpose-built React form with entity pickers for every field. Reattach on save. The editor and the form never need to know about each other.

```ts
// useDocumentEditor.ts
import { parse as parseToml, stringify as stringifyToml } from "@iarna/toml"

function splitFrontmatter(raw: string) {
  const match = raw.match(/^\+\+\+([\s\S]*?)\+\+\+\n([\s\S]*)$/m)
  if (!match) return { frontmatter: {}, body: raw }
  return {
    frontmatter: parseToml(match[1]),
    body: match[2]
  }
}

function joinFrontmatter(frontmatter: object, body: string) {
  return `+++\n${stringifyToml(frontmatter)}+++\n${body}`
}
```

```tsx
export function DocumentEditor({ raw, onSave }) {
  const { frontmatter, body } = splitFrontmatter(raw)
  const [meta, setMeta] = useState(frontmatter)

  // Milkdown only sees `body`
  // FrontmatterForm only sees `meta`
  // On save: joinFrontmatter(meta, currentMarkdown)

  return (
    <div className="doc-editor">
      <FrontmatterForm value={meta} onChange={setMeta} />
      <MilkdownEditor defaultValue={body} />
    </div>
  )
}
```

### FrontmatterForm

Collapsed by default to a single status pill and tag chips. Click to expand. Every field that references another entity uses a popover picker — no free-text fields for values that should be controlled.

```tsx
export function FrontmatterForm({ value, onChange, docType }) {
  const { statuses, tags, models, skills, mcpServers, specs, releases } = useProjectStore()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="frontmatter-form">
      {/* Collapsed summary — always visible */}
      <div className="fm-summary" onClick={() => setExpanded(!expanded)}>
        {value.status && <StatusPill status={value.status} statuses={statuses} />}
        {value.tags?.map(tag => (
          <TagPill key={tag} tag={tag} tags={tags}
            onRemove={() => onChange({ ...value, tags: value.tags.filter(t => t !== tag) })} />
        ))}
        <button className="fm-expand">{expanded ? "▲" : "▼"}</button>
      </div>

      {expanded && (
        <div className="fm-fields">
          <FormField label="Status">
            <StatusSelect value={value.status} options={statuses}
              onChange={status => onChange({ ...value, status })} />
          </FormField>

          <FormField label="Tags">
            <TagInput value={value.tags || []} suggestions={tags}
              onChange={tags => onChange({ ...value, tags })} />
          </FormField>

          {docType === "feature" && (
            <FormField label="Branch">
              <BranchInput value={value.branch || ""}
                onChange={branch => onChange({ ...value, branch })} />
            </FormField>
          )}

          {docType === "feature" && (
            <FormField label="Spec">
              <EntityPicker value={value.spec} entities={specs}
                placeholder="Link a spec..."
                onSelect={spec => onChange({ ...value, spec })}
                onCreate={title => invoke("create_spec", { title })} />
            </FormField>
          )}

          {(docType === "feature" || docType === "spec") && (
            <FormField label="Release">
              <EntityPicker value={value.release} entities={releases}
                placeholder="Link a release..."
                onSelect={release => onChange({ ...value, release })}
                onCreate={title => invoke("create_release", { title })} />
            </FormField>
          )}

          {docType === "feature" && (
            <div className="fm-section">
              <div className="fm-section-label">Agent Config</div>

              <FormField label="Model">
                <ModelSelect value={value.agent?.model} models={models}
                  onChange={model => onChange({
                    ...value, agent: { ...value.agent, model }
                  })} />
              </FormField>

              <FormField label="MCP Servers">
                <MultiEntityPicker
                  value={value.agent?.mcp_servers?.map(s => s.id) || []}
                  entities={mcpServers}
                  onChange={ids => onChange({
                    ...value,
                    agent: { ...value.agent, mcp_servers: ids.map(id => ({ id })) }
                  })} />
              </FormField>

              <FormField label="Skills">
                <MultiEntityPicker
                  value={value.agent?.skills?.map(s => s.id) || []}
                  entities={skills}
                  onChange={ids => onChange({
                    ...value,
                    agent: { ...value.agent, skills: ids.map(id => ({ id })) }
                  })} />
              </FormField>

              <FormField label="Max cost / session">
                <input type="number" step="0.50" min="0"
                  value={value.agent?.max_cost_per_session || ""}
                  onChange={e => onChange({
                    ...value,
                    agent: {
                      ...value.agent,
                      max_cost_per_session: parseFloat(e.target.value) || undefined
                    }
                  })}
                  placeholder="No limit" className="fm-input" />
              </FormField>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### Autocomplete Requirements

Every field that references another entity must offer completions. Soft references (spec, release) show a "create new" affordance when the referenced entity doesn't exist yet — not an error.

| Field | Source | Component |
|-------|--------|-----------|
| `status` | project statuses | `StatusSelect` dropdown |
| `tags` | project tags | `TagInput` pill input with suggestions |
| `branch` | live git branches | `BranchInput` with branch list |
| `spec` | `workflow/specs/` | `EntityPicker` popover + create new |
| `release` | `workflow/releases/` | `EntityPicker` popover + create new |
| `agent.model` | SQLite models cache | `ModelSelect` popover |
| `agent.mcp_servers` | SQLite server library | `MultiEntityPicker` popover |
| `agent.skills` | `agents/skills/` | `MultiEntityPicker` popover |

---

## Title Node

### The Approach

Title lives inside Milkdown as the first block — a custom ProseMirror node that renders large, prevents deletion, and syncs text changes to the filename. No separate title input above the editor.

On save, it serializes as an H1. When loading, the first H1 in the document becomes the title node.

```ts
// plugins/title-node.ts
import { $node, $keymap } from "@milkdown/kit/utils"
import { TextSelection } from "@milkdown/kit/prose/state"

export const titleNode = $node("doc_title", () => ({
  content: "inline*",
  group: "block",
  defining: true,
  isolating: true,
  attrs: { placeholder: { default: "Untitled" } },

  parseDOM: [{ tag: "h1[data-doc-title]" }],
  toDOM: () => ["h1", { "data-doc-title": "", class: "doc-title" }, 0],

  parseMarkdown: {
    match: (node) => node.type === "heading" && node.depth === 1,
    runner: (state, node, type) => {
      state.openNode(type)
      state.next(node.children)
      state.closeNode()
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === "doc_title",
    runner: (state, node) => {
      state.openNode({ type: "heading", depth: 1 })
      state.next(node.content)
      state.closeNode()
    }
  }
}))

export const titleKeymap = $keymap("title", () => ({
  // Enter moves cursor to first body node instead of splitting title
  "Enter": (state, dispatch) => {
    const { $from } = state.selection
    if ($from.node(-1)?.type.name !== "doc_title") return false
    const pos = $from.after(-1)
    const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(pos + 1)))
    dispatch?.(tr.scrollIntoView())
    return true
  },
  // Backspace at start of title does nothing
  "Backspace": (state) => {
    const { $from } = state.selection
    if ($from.node(-1)?.type.name !== "doc_title") return false
    if ($from.parentOffset > 0) return false
    return true
  }
}))
```

### Syncing to Filename

```tsx
// In your editor component
useEffect(() => {
  if (!editor) return
  editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    const originalDispatch = view.dispatch.bind(view)

    view.dispatch = (tr) => {
      originalDispatch(tr)
      if (!tr.docChanged) return
      const titleNode = tr.doc.firstChild
      if (titleNode?.type.name !== "doc_title") return
      const title = titleNode.textContent.trim()
      if (!title) return
      debouncedRenameFile(title)
    }
  })
}, [editor])

const debouncedRenameFile = useDebouncedCallback((title: string) => {
  // Slugifies title, renames file, updates SQLite record
  // ID prefix (spec-001) stays stable — only slug changes
  invoke("rename_document", { currentPath: doc.path, newTitle: title })
}, 800)
```

### Styling

```css
.doc-title {
  border: none;
  color: #f1f5f9;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  outline: none;
  padding: 0 0 16px;
  width: 100%;
}

.doc-title:empty::before {
  content: attr(data-placeholder);
  color: #2d2d44;
  pointer-events: none;
}
```

Empty title shows placeholder text. No auto-generated titles. First keypress populates it.

---

## Slash Commands

### Setup

Uses Milkdown's `slashFactory` with a custom React view component. The trigger, filtering, and keyboard navigation are all owned by Shipwright.

```ts
import { slashFactory } from "@milkdown/kit/plugin/slash"

const slash = slashFactory("shipwrightSlash")

editor
  .use(slash)
  .use($view(slash.key, () =>
    pluginViewFactory({ component: SlashView })
  ))
```

### Command Definitions

Three categories: Shipwright, AI, Insert. The Shipwright category is what differentiates this editor from any generic markdown tool.

```ts
// slash/commands.ts
export type SlashCommand = {
  id: string
  label: string
  description: string
  icon: string
  keywords: string[]
  category: "shipwright" | "ai" | "insert"
  action: (ctx: Ctx, view: EditorView) => void
}

export const SLASH_COMMANDS: SlashCommand[] = [

  // ── Shipwright ────────────────────────────────────────────────────────────

  {
    id: "link-issue",
    label: "Link Issue",
    description: "Reference an open issue inline",
    icon: "⊙",
    keywords: ["issue", "link", "task"],
    category: "shipwright",
    action: (ctx) => ctx.get(issuePickerCtx).open()
  },
  {
    id: "link-spec",
    label: "Link Spec",
    description: "Reference a spec document",
    icon: "◈",
    keywords: ["spec", "link", "reference"],
    category: "shipwright",
    action: (ctx) => ctx.get(specPickerCtx).open()
  },
  {
    id: "link-adr",
    label: "Link ADR",
    description: "Reference an architecture decision",
    icon: "◎",
    keywords: ["adr", "decision", "architecture"],
    category: "shipwright",
    action: (ctx) => ctx.get(adrPickerCtx).open()
  },
  {
    id: "create-issue",
    label: "Create Issue",
    description: "Create an issue from selected text",
    icon: "+",
    keywords: ["issue", "create", "new", "task"],
    category: "shipwright",
    action: (ctx, view) => {
      const { selection } = view.state
      const selected = view.state.doc.textBetween(selection.from, selection.to)
      invoke("create_issue", { title: selected || "" })
    }
  },
  {
    id: "extract-issues",
    label: "Extract Issues",
    description: "Ask AI to extract issues from this document",
    icon: "⟐",
    keywords: ["extract", "issues", "ai", "generate"],
    category: "shipwright",
    action: () => invoke("extract_issues_from_current_doc")
  },

  // ── AI ────────────────────────────────────────────────────────────────────

  {
    id: "ai-continue",
    label: "Continue writing",
    description: "AI continues from cursor position",
    icon: "→",
    keywords: ["ai", "continue", "write", "generate"],
    category: "ai",
    action: (ctx, view) => {
      const before = view.state.doc.textBetween(0, view.state.selection.from)
      ctx.get(aiCompletionCtx).complete(before)
    }
  },
  {
    id: "ai-improve",
    label: "Improve selection",
    description: "AI rewrites selected text",
    icon: "✦",
    keywords: ["ai", "improve", "rewrite", "edit"],
    category: "ai",
    action: (ctx, view) => {
      const { selection } = view.state
      const text = view.state.doc.textBetween(selection.from, selection.to)
      ctx.get(aiCompletionCtx).rewrite(text, selection)
    }
  },
  {
    id: "ai-summarize",
    label: "Summarize",
    description: "AI summarizes this document",
    icon: "◻",
    keywords: ["ai", "summarize", "tldr"],
    category: "ai",
    action: (ctx) => ctx.get(aiCompletionCtx).summarize()
  },

  // ── Insert ────────────────────────────────────────────────────────────────

  {
    id: "heading-2",
    label: "Heading 2",
    description: "Large section heading",
    icon: "H2",
    keywords: ["h2", "heading", "title"],
    category: "insert",
    action: (ctx) => ctx.get(commandsCtx).call(TurnIntoHeading, 2)
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    keywords: ["h3", "heading"],
    category: "insert",
    action: (ctx) => ctx.get(commandsCtx).call(TurnIntoHeading, 3)
  },
  {
    id: "code-block",
    label: "Code block",
    description: "Insert fenced code block",
    icon: "<>",
    keywords: ["code", "block", "fence"],
    category: "insert",
    action: (ctx) => ctx.get(commandsCtx).call(CreateCodeBlock)
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a table",
    icon: "⊞",
    keywords: ["table", "grid"],
    category: "insert",
    action: (ctx) => ctx.get(commandsCtx).call(InsertTable)
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule",
    icon: "—",
    keywords: ["divider", "hr", "rule", "separator"],
    category: "insert",
    action: (ctx) => ctx.get(commandsCtx).call(InsertHr)
  },
]
```

### Slash Menu Component

```tsx
// slash/SlashView.tsx
export function SlashView() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [, getEditor] = useInstance()

  const filtered = SLASH_COMMANDS.filter(cmd =>
    !query ||
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.keywords.some(k => k.startsWith(query.toLowerCase()))
  )

  const grouped = {
    shipwright: filtered.filter(c => c.category === "shipwright"),
    ai:         filtered.filter(c => c.category === "ai"),
    insert:     filtered.filter(c => c.category === "insert"),
  }

  const categoryLabels = { shipwright: "Shipwright", ai: "AI", insert: "Insert" }

  const { onKeydown } = useSlashProvider({
    trigger: "/",
    offset: { x: 0, y: 8 },
    ref,
    onShow: () => { setQuery(""); setSelected(0) },
    onKeydown({ key }) {
      if (key === "ArrowDown") { setSelected(i => Math.min(i + 1, filtered.length - 1)); return true }
      if (key === "ArrowUp")   { setSelected(i => Math.max(i - 1, 0)); return true }
      if (key === "Enter")     { runCommand(filtered[selected]); return true }
      return false
    }
  })

  function runCommand(cmd: SlashCommand) {
    if (!cmd) return
    getEditor().action(ctx => {
      const view = ctx.get(editorViewCtx)
      cmd.action(ctx, view)
    })
  }

  return (
    <div ref={ref} className="slash-menu" onKeyDown={onKeydown}>
      {Object.entries(grouped).map(([category, cmds]) =>
        cmds.length === 0 ? null : (
          <div key={category}>
            <div className="slash-category">{categoryLabels[category]}</div>
            {cmds.map(cmd => {
              const globalIndex = filtered.indexOf(cmd)
              return (
                <div
                  key={cmd.id}
                  className={`slash-item ${globalIndex === selected ? "selected" : ""}`}
                  onMouseEnter={() => setSelected(globalIndex)}
                  onClick={() => runCommand(cmd)}
                >
                  <span className="slash-icon">{cmd.icon}</span>
                  <div>
                    <div className="slash-label">{cmd.label}</div>
                    <div className="slash-desc">{cmd.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
      {filtered.length === 0 && (
        <div className="slash-empty">No commands match "{query}"</div>
      )}
    </div>
  )
}
```

### Slash Menu CSS

```css
.slash-menu {
  background: #0d0d12;
  border: 1px solid #1e1e2e;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  max-height: 360px;
  min-width: 280px;
  overflow-y: auto;
  padding: 6px;
  position: fixed;
  z-index: 100;
}

.slash-category {
  color: #2d2d44;
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 8px 10px 4px;
  text-transform: uppercase;
}

.slash-item {
  align-items: center;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 8px 10px;
  transition: background 0.1s;
}

.slash-item.selected,
.slash-item:hover { background: #1a1a2e; }

.slash-icon {
  color: #4a5568;
  flex-shrink: 0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  text-align: center;
  width: 20px;
}

.slash-label { color: #e2e8f0; font-size: 13px; }
.slash-desc  { color: #4a5568; font-size: 11px; margin-top: 1px; }
.slash-empty { color: #2d2d44; font-size: 12px; padding: 16px; text-align: center; }
```

---

## Entity Reference Nodes

Issue and spec references render as inline chips. They serialize to `[[issue-001]]` syntax in markdown, parse back on load, and are clickable to open the referenced entity.

```ts
// plugins/entity-refs.ts
import { $node, $inputRule } from "@milkdown/kit/utils"
import { InputRule } from "@milkdown/kit/prose/inputrules"

export const issueRefNode = $node("issue_ref", () => ({
  group: "inline",
  inline: true,
  atom: true,
  attrs: { id: {}, title: { default: "" } },
  parseDOM: [{
    tag: "span[data-issue-ref]",
    getAttrs: dom => ({
      id: dom.getAttribute("data-id"),
      title: dom.getAttribute("data-title"),
    })
  }],
  toDOM: node => ["span", {
    "data-issue-ref": "",
    "data-id": node.attrs.id,
    class: "entity-chip entity-chip--issue",
  }, `⊙ ${node.attrs.id}`],
  parseMarkdown: {
    match: node => node.type === "text" && /\[\[issue-\d+\]\]/.test(node.value),
    runner: (state, node) => {
      const match = node.value.match(/\[\[(issue-\d+)\]\]/)
      if (match) state.addNode("issue_ref", { id: match[1] })
    }
  },
  toMarkdown: {
    match: node => node.type.name === "issue_ref",
    runner: (state, node) => state.addLiteral(`[[${node.attrs.id}]]`)
  }
}))

// Typing [[issue- opens the picker
export const issueRefInputRule = $inputRule(() =>
  new InputRule(/\[\[issue-$/, (state, _match, start, end) => {
    openIssuePicker({ replaceRange: { start, end } })
    return null
  })
)
```

```css
.entity-chip {
  border-radius: 4px;
  cursor: pointer;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  padding: 1px 6px;
  user-select: none;
}

.entity-chip--issue {
  background: #1a2a3a;
  border: 1px solid #1e3a5f;
  color: #60a5fa;
}

.entity-chip--issue:hover { background: #1e3a5f; }

.entity-chip--spec {
  background: #1a2a1a;
  border: 1px solid #1e5f1e;
  color: #6ee7b7;
}

.entity-chip--spec:hover { background: #1e5f1e; }
```

---

## Editor Space and Fullscreen

### OS Fullscreen via Tauri

```rust
// Tauri command — toggle OS fullscreen
#[tauri::command]
fn toggle_fullscreen(window: tauri::Window) {
    let is_fullscreen = window.is_fullscreen().unwrap_or(false);
    window.set_fullscreen(!is_fullscreen).ok();
}
```

```tsx
// Keep button state in sync with OS fullscreen gestures (F11, green button on macOS)
useEffect(() => {
  const unlisten = appWindow.listen("tauri://resize", async () => {
    setFullscreen(await appWindow.isFullscreen())
  })
  return () => { unlisten.then(fn => fn()) }
}, [])

async function toggleFullscreen() {
  await invoke("toggle_fullscreen")
  setFullscreen(f => !f)
}
```

### Zen Mode

Separate from OS fullscreen. Pure React state. Hides sidebar and frontmatter, centers the editor, and makes toolbar chrome fade unless hovered. Keyboard shortcut `Cmd+Shift+F`.

```tsx
const [zenMode, setZenMode] = useState(false)

useEffect(() => {
  function handleKey(e: KeyboardEvent) {
    if (e.metaKey && e.shiftKey && e.key === "f") {
      e.preventDefault()
      setZenMode(z => !z)
    }
  }
  window.addEventListener("keydown", handleKey)
  return () => window.removeEventListener("keydown", handleKey)
}, [])
```

```css
.app-layout.zen .sidebar         { display: none; }
.app-layout.zen .frontmatter-form { display: none; }

.app-layout.zen .main-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px;
}

/* Toolbar fades unless hovered */
.app-layout.zen .editor-header {
  opacity: 0;
  transition: opacity 0.2s;
}
.app-layout.zen:hover .editor-header { opacity: 1; }
```

### Floating Selection Toolbar

Replaces the persistent toolbar above the editor. Appears on text selection only. Uses Milkdown's tooltip plugin.

```tsx
import { tooltipFactory } from "@milkdown/kit/plugin/tooltip"

const selectionTooltip = tooltipFactory("selection")

editor
  .use(selectionTooltip)
  .use($view(selectionTooltip.key, () =>
    tooltipPluginViewFactory({ component: SelectionToolbar })
  ))
```

```tsx
function SelectionToolbar() {
  return (
    <div className="selection-toolbar">
      <ToolbarBtn onClick={toggleBold}><Bold size={12} /></ToolbarBtn>
      <ToolbarBtn onClick={toggleItalic}><Italic size={12} /></ToolbarBtn>
      <ToolbarBtn onClick={toggleCode}><Code size={12} /></ToolbarBtn>
      <div className="toolbar-divider" />
      {/* Shipwright-specific — the differentiator */}
      <ToolbarBtn onClick={createIssueFromSelection}>⊙ Issue</ToolbarBtn>
      <ToolbarBtn onClick={linkSelection}>◈ Spec</ToolbarBtn>
    </div>
  )
}
```

```css
.selection-toolbar {
  align-items: center;
  background: #0d0d12;
  border: 1px solid #1e1e2e;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  display: flex;
  gap: 2px;
  padding: 4px;
}

.toolbar-divider {
  background: #1e1e2e;
  height: 16px;
  margin: 0 4px;
  width: 1px;
}
```

---

## Keyboard Reference

| Shortcut | Action |
|----------|--------|
| `/` | Open slash command menu |
| `[[` | Begin entity reference (issue or spec picker opens) |
| `Enter` in title | Move cursor to first body node |
| `Cmd+Shift+F` | Toggle zen mode |
| `F11` | Toggle OS fullscreen |
| `Cmd+S` | Save (auto-save is also active, debounced 500ms) |
| `Escape` | Close slash menu / close selection tooltip |
