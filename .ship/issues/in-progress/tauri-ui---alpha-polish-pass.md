+++
id = "03aee7db-a107-486e-9194-8fb775b4e897"
title = "Tauri UI — Alpha Polish Pass"
created = "2026-02-23T02:29:08.234849952Z"
updated = "2026-02-24T03:05:56.573605Z"
tags = []
links = []
+++

Everything the macOS Tauri session needs to complete for alpha done criteria.

## Views to build / complete

### Kanban (default landing view) — criteria #5, #6
- Columns driven by `config.toml` `[[statuses]]`
- Cards: title, assignee, tags
- Drag-and-drop moves the file to the correct status folder + updates `updated` timestamp
- Click card → Issue Detail
- File-watch refresh so agent moves appear live (criterion #9)

### Issue Detail — criterion #9
- Full markdown render
- Edit in place (title, body, assignee, tags, spec ref)
- Frontmatter fields as a form, not raw TOML
- Auto-saves on blur

### Spec Editor — criteria #3, #4
- Split view: left = editable markdown, right = AI conversation via MCP sampling
- "Extract Issue" button → creates issue pre-populated from spec context
- Scoped to the open spec

### ADR List
- Table: status, date, title
- Click to read full ADR
- "New ADR" button

### Settings
- GUI for `config.toml`: statuses (add/remove/reorder/recolor), git behaviour, templates
- Replaces hand-editing TOML for non-technical users

## Polish requirements
- Empty states for every view: one sentence + one CTA
- Spec Editor empty state especially welcoming (target: non-technical PMs)
- Typography and spacing consistent throughout
- Should feel like Linear, not a weekend project

## App icon
- `src-tauri/icons/` currently has placeholder Tauri icons
- Run `tauri icon logo.svg` from `crates/ui/` to regenerate all sizes from the SVG
- Or: `convert logo.svg -resize 512x512 icon.png && tauri icon icon.png`

## MCP auto-start
- MCP server should start automatically when `ship ui` / app launches
- Visible status indicator in UI (connected / not connected)
- Spec: recommend auto-start with indicator

## macOS-specific fixes
- Fix directory picker (open project dialog) — currently broken on macOS
- Test `ship init` path from the app onboarding flow

## File watching
- Kanban and Issue Detail must refresh when `.ship/issues/` changes on disk
- Enables criterion #9: agent updates issue → change appears in UI immediately
- Use Tauri's `watch` plugin or `notify` crate

Extracted Tauri calls/events out of App.tsx into src/platform/tauri/{commands,events,runtime}. App now consumes typed wrappers instead of direct invoke/listen, reducing root coupling and preparing for Query/Router feature modules.

Reference repo tauri-tanstarter confirmed package baseline for this app: TanStack Router + React Query + Radix/shadcn utility stack. Plan is to install with pnpm and migrate from monolithic App.tsx to route layouts + feature modules using the new platform/tauri gateway.

Removed shadcn scaffold demo takeover: restored crates/ui/src/App.tsx to the real Tauri UI shell and deleted generated example files (component-example.tsx, example.tsx). Verified with pnpm --dir crates/ui build.

Dropped legacy App.css styling intentionally for migration. Replaced with shadcn-focused baseline (tokens, @theme mapping, base layer) plus only minimal shell layout classes (.app-shell, .sidebar, .main-content). This is a deliberate break-forward step for feature-by-feature rebuild.

Introduced TanStack Router scaffold with routes/__root.tsx and routes/index.tsx, plus src/router.tsx registration. main.tsx now mounts RouterProvider inside QueryClientProvider. Also replaced no-project first-load screen with new shadcn-based ProjectOnboarding component (autodetect candidate, recent project selection, open/create actions).

Adjusted migration flow to avoid legacy unstyled shell on first load: App now returns the new ProjectOnboarding view (no legacy sidebar) whenever no project is active, and no longer auto-restores persisted active project during startup. Updated index.html branding (favicon/title) and verified with pnpm --dir crates/ui build.

Reworked no-project IA: removed explicit 'global view' framing, merged autodetected project into the existing-project list, and made detection contextual (button only when needed). Added a real Create Project form on onboarding (name, description, directory picker, defaults vs custom statuses). Implemented new Tauri commands pick_project_directory + create_project_with_options and wired frontend wrappers. Verified with pnpm --dir crates/ui build and cargo check -p ui.

Updated no-project onboarding UX: added Ship branding hero, moved create-project flow into a dialog, tightened existing-project card spacing (removed stretched split-card layout), and added a global settings popover with theme/MCP/user summary plus 'Open full settings page' action.

Fixed onboarding/settings runtime crash by wrapping dropdown label/items in DropdownMenuGroup (Base UI Menu.Group context). Replaced small UI logo usage with bounded /logo-mark.png in onboarding + sidebar and updated favicon to /logo-mark.png to avoid oversized SVG canvas rendering in a corner. Verified with pnpm --dir crates/ui build and cargo check -p ui.

Refactor chunk completed: rewrote SettingsPanel to shared UI primitives (Card/Button/Input/Select/Textarea/Label/Badge/Separator) and replaced legacy class-based controls. Added local shadcn-style wrappers for Tabs, Switch, and Checkbox in src/components/ui/ using @base-ui/react since registry fetch is offline in this environment. Preserved behavior for theme preview, MCP toggle/port, default status, project metadata, status CRUD, and git category toggles. Verified with pnpm --dir crates/ui build and cargo check -p ui.

Sidebar refactor completed to shared primitives: replaced legacy class-hook markup with shadcn-style composition (Button/Badge/Separator + lucide icons) and a cleaner project switcher/navigation layout. Kept existing behavior for section switching, open/new/select project actions, and active settings state. Verified with pnpm --dir crates/ui build and cargo check -p ui.

UI content refactor chunk completed: migrated ProjectsDashboard, IssueList, AdrList, LogPanel, NewIssueModal, and NewAdrModal to shared primitives and utility-first layouts (Card/Button/Badge/Select/Input/Textarea/AlertDialog). Updated App.tsx section wrappers and error banner to remove legacy class dependencies and improve content presentation for issues/adrs/log pages. Preserved behavior (project switching, issue/ADR creation, status selection, markdown preview, keyboard shortcuts, log refresh). Verified with pnpm --dir crates/ui build and cargo check -p ui.

Refactor pass: migrated IssueDetail, AdrDetail, and SpecDetail to a shared DetailSheet with shadcn primitives (cards/inputs/buttons/badges), removing remaining legacy class-based overlays. Updated Projects Overview with quick links to Issues/Specs/ADRs/Activity and improved Specs + ADR pages to table/list layouts aligned to alpha IA. Verified with pnpm --dir crates/ui build and cargo check -p ui.

UX feedback pass completed: split IA into project-scoped Overview vs separate Projects page (new sidebar Projects nav), added ProjectOverview dashboard, and removed duplicate Activity Log surface from Decisions page. Also centered detail editors in a shared max-width sheet and expanded New Issue/ADR/Spec dialogs for workable editing space.

Architecture correction pass: split monolithic App into route-aware shell + dedicated useWorkspaceController hook. App now handles composition/navigation while state/effects/actions live in src/hooks/useWorkspaceController.ts. Added / route so routes dir is functional and URL maps to section state (overview/projects/issues/specs/adrs/activity/settings). Also moved Projects to picker controls, kept Overview in sidebar nav, removed embedded activity from Issues/Specs, and updated branding text/logo sizing.

Clarification: router now includes dynamic section path '/$section' in src/routes/$section.tsx and route tree wiring in src/router.tsx.

Hook decomposition pass completed. Split useWorkspaceController into focused modules: workspace/constants.ts, workspace/useWorkspaceLifecycle.ts, workspace/useProjectActions.ts, workspace/useIssueActions.ts, workspace/useAdrActions.ts, workspace/useSpecActions.ts, and workspace/useSettingsActions.ts. Controller now orchestrates composition only (~214 LOC) while preserving existing App contract. Verified with pnpm --dir crates/ui build and cargo check -p ui.

Wired TanStack Router as the source of truth: root route now mounts WorkspaceProvider + App layout, explicit routes registered for overview/projects/issues/specs/adrs/activity/settings, removed legacy / route, and verified with pnpm --dir crates/ui build + cargo check -p ui.

Correction: removed the legacy /$section catch-all UI route file so only explicit routed sections are mounted.

Fixed overview freeze by making section actions route-first: sidebar/breadcrumb section changes now navigate immediately, overview quick actions navigate directly, settings back navigates to /overview, and path normalization now handles trailing slashes during route<->section sync.

Extracted route section/path/label mapping out of App.tsx into src/routes/sections.ts and switched App + overview route to consume the shared module. This keeps route metadata centralized and reduces root layout churn.

Moved route metadata out of src/routes into src/lib/constants/routes.ts, removed routes/sections.ts, and switched App/overview/settings/index to consume centralized route constants/helpers. Route files remain focused on route definitions.

Removed workspace-level navigation state so the router path is now the only navigation source: deleted activeSection/NavSection usage from workspace controller + action hooks, moved sidebar/project-overview to path-based navigation, and switched App shell to route-path matching via lib/constants/routes.ts.

Polish pass shipped: sidebar collapse now stacks logo/toggle vertically, renamed Project Picker to Projects, added sidebar button titles as tooltips, enforced no app-level horizontal scroll, fixed breadcrumb for /projects to show only Projects, project selection now routes to /overview, list_projects now returns issue_count and UI preserves/displays it, and issue/ADR/spec creation moved to wide DetailSheet editors with split markdown mode.

Removed route shadowing helper from App (now uses normalized router pathname directly), refreshed Activity UI with a purple timeline card style and richer visual hierarchy, and shifted global theme tokens to a purple accent palette aligned with logo branding.

Adjusted theme back to yellow primary with purple secondary/accent, removed appRouteFromPath mapper (App now reads normalized pathname directly), redesigned Issues board with concise cards + stronger color treatment, added native drag/drop between status columns, widened Issues layout to fit columns on-screen, and themed scrollbars to match app styling.

UI pass: reworked Issues board to responsive non-horizontal Kanban columns, markdown excerpt cards (100-char summary), native drag/drop between statuses, per-column internal scroll, stronger status color treatment, and themed route header. Built with pnpm to verify.

Follow-up: hardened issue drop handling for Tauri/WebKit drag event ordering. Added drag payload ref fallback, delayed dragend cleanup, and column-level drop handlers on cards to ensure drop works even when releasing over another draggable card. Also updated activity cards with typed kind+actor badges and multi-color accents.

Alpha closeout pass: replaced Issue board HTML5 drag/drop with dnd-kit pointer sensors for reliable Tauri drop handling, simplified Activity Log styling (removed gradients/heavy effects), and added log retention in logic so log.md is pruned to latest 200 entries with UI reads capped to 200.

Follow-up bugfixes: removed dnd drag overlay clone to prevent oversized/faded double while dragging, added post-drag click suppression in IssueList to avoid accidental detail opening, and updated status move reducer to match both file_name and source status to prevent duplicate card edge cases.

DnD visual polish: switched Issue card drag transform to translate-only (no scale component), added touch-none/select-none and stabilized dragging z-index/shadow to prevent oversized/distorted drag visuals in Tauri WebView.

DnD visibility fix: made issue columns overflow-visible and card items positioned relative so dragged cards are not clipped to source column while crossing targets.

DnD visibility hard fix: reintroduced controlled DragOverlay (adjustScale=false, no drop animation) and hide source card while dragging. This avoids column/scroll clipping in Tauri and keeps dragged card visible across target columns.
