<div align="center">

<br />

# ⬛ WorkStash

### **The spatial task workspace for people who think in space, not in lists.**

*Stop scrolling. Start seeing.*

<br />

[![Built with React](https://img.shields.io/badge/React_19-black?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-black?style=flat-square&logo=typescript&logoColor=3178C6)](https://typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_v4-black?style=flat-square&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-black?style=flat-square)](https://zustand-demo.pmnd.rs)

</div>

---

## The problem with every other to-do app

You open your task manager. There are **147 items** staring back at you. You scroll past things you added in March. You add three more. You feel simultaneously busy and paralysed. You close the tab.

This is not a productivity problem. It's a **spatial problem.**

The human brain does not think in infinite vertical lists. It thinks in **space**. In rooms. In proximity. In weight. When your desk is overloaded, you *see* it. When your list is overloaded, your app just... scrolls.

---

## WorkStash is different — radically different

> **Every task is a physical block on a finite grid.**
>
> You can't add what won't fit. You can't hide overwhelm behind a scrollbar.
> The grid tells the truth.

WorkStash treats tasks like objects on your desk. Each block occupies real estate — 1×1 for a quick hit, up to 3×2 for your deepest focus work. When the grid is full, it's **full**. You have to complete, archive, or rethink before adding more.

This isn't a limitation. It's the feature.

---

## What makes it new

### 🧱 The Bento Grid — *your cognitive load made visible*

Tasks aren't list items. They're **blocks with weight**. A 1×1 micro task (approve expense report) sits visually smaller than a 3×2 deep focus block (redesign checkout flow). At a glance — literally one second — you know:

- How much you've taken on
- What's urgent vs. what's deep
- Whether you're being honest with yourself about your capacity

The grid has a hard cap: **24, 30, or 32 cells** depending on your layout. No overflow. No hidden backlog. No lies.

---

### ⚡ Four Board Modes — *reshape the board, not your brain*

Context switches are brutal. WorkStash doesn't fight them — it **adapts to them**.

| Mode | What it does |
|------|-------------|
| **All Blocks** | Full spatial overview of everything on your plate |
| **Solo Focus** | One task expands to dominate the grid. Everything else parks. |
| **Urgent First** | Fire-mode layout — urgent tasks stack up front, everything else compresses |
| **Admin Sweep** | Only admin tasks visible. Clear the queue, then get back to deep work |

Switch modes and the board *physically rearranges* itself in front of you. It's not filtering. It's a different *perspective on the same reality*.

---

### 🎯 Focus Shutter — *go deep without leaving*

Hover any block and press **`F`**. The world blurs away. Your task expands fullscreen with its full toolkit:

- **Scratchpad** — raw notes, error logs, half-formed ideas
- **Subtask checklist** — granular breakdown with progress tracking
- **Pomodoro timer** — deep work sessions with 5m/15m/25m/45m presets and custom duration
- **Energy budget** — 1–5 bar cognitive cost indicator

Press **`Esc`** and you're instantly back on the grid. Zero friction. Zero mode switching anxiety.

---

### 📥 Holding Pen — *capture without committing*

Interruptions happen. A thought pops up mid-flow. A Slack message demands attention.

The **Holding Pen** is an off-grid inbox that lives below the workspace. Capture anything there instantly — it **never touches your grid capacity**. When you're ready, promote items onto the board with a single click (`↗`). Not ready? They wait, patiently, without guilt.

---

### 🔮 End-of-Day Defrag

At the end of your day, hit **Defrag**. Watch the grid visualize your completed blocks, then sweep them away. The board compacts and resets — like clearing your desk before tomorrow.

It's a *ritual*, not a button. The difference matters.

---

### 📊 Live Workspace Analytics

Scroll below the grid and you get honest telemetry about yourself:

- **Focus heatmap** — which days you actually did deep work (based on completed timers)
- **Energy allocation** — how your cognitive budget is distributed across categories
- **Session history** — every focus session you've completed, with time spent

No gamification. No streaks designed to make you compulsive. Just **honest data about how you work**.

---

### ⏱ Active Timer Widget

Start a focus session and a floating widget appears bottom-left — always visible, never intrusive. It pulses with the task's category color, shifts to amber as time runs low, and lets you pause or restart without breaking flow. Click it to jump straight into Focus Shutter.

---

## Feature overview

| Feature | Description |
|---------|-------------|
| **Bento Grid** | Layouts: `6×4` (24 cells), `8×4` (32 cells), `6×5` (30 cells) |
| **Task sizes** | 1×1 Micro · 2×1 List · 2×2 Focus · 3×2 Deep |
| **Categories** | Deep Focus · Urgent · Quick Admin · Holding Pen |
| **Board modes** | All Blocks · Solo Focus · Urgent First · Admin Sweep |
| **Per-task tools** | Notes · Subtask checklist · Pomodoro timer · Energy budget |
| **Focus Shutter** | Fullscreen single-task mode — `F` to open, `Esc` to exit |
| **Holding Pen** | Off-grid inbox, never eats capacity |
| **Archive** | Archive completed blocks; restore them anytime |
| **Defrag** | Animated end-of-day ritual to clear and compact the grid |
| **Analytics** | Heatmap · energy distribution · session history |
| **Timer widget** | Floating active-timer indicator with pulse animation |
| **Drag to reorder** | Rearrange tiles spatially by dragging |
| **Smooth scroll** | Lenis-powered buttery scroll from workspace → analytics |
| **Persistence** | Everything saved automatically, on-device, no account needed |

---

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

| Script | What it does |
|--------|--------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production bundle → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |

---

## How to use it (the 60-second version)

1. **+ New Task** → pick a title, size (cognitive weight), and category
2. **Click any title** to rename it inline
3. **Click a category badge** to reclassify a task
4. **Drag tiles** to reorder them spatially
5. **Hover a tile + press `F`** → Focus Shutter opens
6. **Switch board modes** from the top-left header as context demands
7. **Capture interruptions** in the Holding Pen — never lose a thought
8. **Defrag** at end of day — it's a ritual, make it one
9. **Scroll down** for analytics
10. **Hover `x/24`** in the header to understand your capacity breakdown

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 (utility-first, custom design tokens) |
| State | Zustand with `persist` middleware |
| Drag & drop | `@dnd-kit` (sortable + pointer sensor) |
| Smooth scroll | `@studio-freight/lenis` |
| Animations | `@formkit/auto-animate` + custom CSS keyframes |

---

## Project structure

```
src/
  store.ts                   # All domain state, actions, persistence, analytics helpers
  App.tsx                    # App shell, scroll, modals, global layout
  index.css                  # Design tokens, Tailwind theme, global styles
  components/
    BentoGrid.tsx            # Main grid + drag-and-drop orchestration
    Tile.tsx                 # Task card UI (resize, rename, archive, drag)
    TileContent.tsx          # Per-size content (checklist, notes, timer, energy)
    TimerControls.tsx        # Pomodoro timer widget (minimal + full)
    ActiveTimerWidget.tsx    # Floating global timer indicator
    Header.tsx               # Mode switcher, capacity counter, action buttons
    FocusShutter.tsx         # Fullscreen focus overlay
    HoldingPenDock.tsx       # Off-grid inbox dock
    AnalyticsDashboard.tsx   # Heatmap, energy allocation, session history
    ArchiveModal.tsx         # Browse and restore archived blocks
    NewTaskModal.tsx         # Create task flow
    DefragOverlay.tsx        # Animated defrag ritual
    HelpModal.tsx            # Onboarding + quick reference
    SettingsModal.tsx        # Grid layout, workspace reset
    GlowCard.tsx             # Shared glassmorphic card primitive
```

---

## Notes & known behaviour

- Timers pause on page reload — they don't run in the background.
- Only one timer runs at a time globally.
- Restoring an archived block checks grid capacity first — if tight, it restores at 1×1.
- All data is stored on-device via `localStorage`. No account. No server. No telemetry.

---

<div align="center">

**WorkStash is a statement against the infinite list.**
**It believes your attention is finite. Your tools should agree.**

*Built with obsessive attention to feel, flow, and honesty.*

</div>
