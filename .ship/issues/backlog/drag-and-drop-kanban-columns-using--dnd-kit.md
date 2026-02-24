+++
id = "e172c728-92d3-4465-bfb7-3b78add97863"
title = "Drag-and-drop kanban columns using @dnd-kit"
created = "2026-02-23T03:06:04.409759882Z"
updated = "2026-02-23T05:17:42.030303Z"
tags = []
links = []
+++

## Requirements

Dragging a card between columns calls `move_issue_status` and moves the file. This is alpha done criterion #6.

## Library

Use `@dnd-kit/core` + `@dnd-kit/sortable`. Do NOT use react-beautiful-dnd (deprecated/unmaintained).

```
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Behaviour

- Wrap the board in `<DndContext>` with `onDragEnd` handler
- Each column is a `<SortableContext>` (droppable)
- Each card is a `<SortableItem>` (draggable)
- `onDragEnd`: if `over.id !== active.data.current.status`, call `move_issue_status(fileName, fromStatus, toStatus)`
- Optimistic update: update local state immediately, revert on error
- While dragging: card at 90% opacity + drop shadow
- Target column: highlight with border + dim background (`border-blue-500/40 bg-blue-500/5`)
- Drag within same column: reorder visually (persistence is v1)

## Keyboard accessibility
`@dnd-kit` supports keyboard drag by default — don't disable it.

## References
Spec: `ui-vision---production-roadmap.md` — View 1: Kanban Board

Blocked in this environment: installing @dnd-kit packages fails with ENOTFOUND against registry.npmjs.org, so dependency fetch is currently unavailable. Deferring implementation until npm registry access is available.
