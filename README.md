# WorkStash

A spatial task workspace — tasks live as resizable tiles on a finite bento grid, not as an endless list.

Size reflects cognitive weight. Capacity is limited on purpose. Topology modes reshape the board for how you’re working today.

## Features

- **Bento grid** with layouts `6×4` (24), `8×4` (32), or `6×5` (30 cells)
- **Categories:** Deep Work, Firefighter, Admin, plus a Holding Pen inbox
- **Topology modes:** Normal, Deep Work, Firefighter, Admin Sweep
- **Per-task tools:** notes, subtasks, pomodoro timer, energy budget
- **Focus Shutter** — fullscreen focus (`F` while hovering a tile, `Esc` to exit)
- **End-of-Day Defrag** — clear completed blocks and compact the grid
- **Live analytics** — focus heatmap from completed timers, energy allocation from tile budgets
- **Persistence** — workspace saved automatically in the browser (localStorage)

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

| Script | What it does |
|--------|----------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production bundle → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |

## How to use

1. **New Task** — pick title, size (cognitive weight), and category
2. **Click a title** to rename · **click the category badge** to reclassify
3. Switch topology modes from the header when context changes
4. Hover a tile and press **F** for Focus Shutter
5. Capture interruptions in the **Holding Pen**; use **↗** to promote an item onto the grid
6. Scroll down for **Workspace Analytics**
7. **End-of-Day Defrag** when you’re done clearing completed work
8. **Settings ⚙** — change grid size or reset the workspace

Data survives refresh. Reset (Settings → Reset workspace) restores starter tasks and clears analytics.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand (with persist) · @dnd-kit · Lenis

## Project layout

```
src/
  store.ts                 # Domain state, persistence, analytics helpers
  App.tsx                  # Layout, scroll, modals
  components/
    BentoGrid.tsx          # Grid + drag-and-drop
    Tile.tsx / TileContent # Task UI (edit, timer, tabs)
    Header.tsx             # Modes, capacity, actions
    FocusShutter.tsx
    AnalyticsDashboard.tsx # Live telemetry
    …
```

## Notes

- Timers pause across reloads (they don’t keep running in the background).
- Only one timer runs at a time.
- Everything stays on-device — there is no account or server sync yet.
