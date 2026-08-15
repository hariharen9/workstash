# WorkStash — Product & Engineering TODO Roadmap

This roadmap tracks missing specifications from [`idea.md`](./idea.md), high-impact feature enhancements, UX polish, and technical capabilities to take WorkStash to completion.

---

## 🎯 Phase 1: Unimplemented Specs from `idea.md`

- [ ] **[P1] Bio-Telemetry & Break Quick Logger**
  - **Goal**: Add a 1-click wellness and break logging dock to the telemetry/analytics area.
  - **Details**:
    - Quick-tap actions: 💧 *Drank Water (250ml)*, 🚶 *Took a Break / Walk (10m)*, 🧘 *Posture Stretch (5m)*, ☕ *Coffee / Tea*.
    - Record entries into `activityLogs` with type `'rest'` or custom telemetry tags.
    - Display aggregate break and wellness statistics alongside focus hours.
  - **Target Files**: `src/store.ts`, `src/components/AnalyticsDashboard.tsx`.

- [ ] **[P1] Formatted Code & Error Scratchpads in Notes**
  - **Goal**: Allow developers to store formatted code snippets and error logs in task notes.
  - **Details**:
    - Support Markdown formatting and fenced code blocks (` ```ts `, ` ```json `, etc.) or a lightweight code editor theme with line numbers.
    - Add quick syntax toggle / preview in standard $2\times2$, $3\times2$, and Focus Shutter view modes.
  - **Target Files**: `src/components/TileContent.tsx`, `src/components/FocusShutter.tsx`.

- [ ] **[P2] Cognitive Overload & Energy Budgeting Warnings**
  - **Goal**: Help users stay within realistic daily attention limits.
  - **Details**:
    - Set an optional daily maximum cognitive energy budget (e.g., 8 hours / 16 energy units).
    - Provide a gentle ambient warning or indicator on the grid header when total active tasks exceed sustainable capacity.
  - **Target Files**: `src/store.ts`, `src/components/Header.tsx`, `src/components/AnalyticsDashboard.tsx`.

---

## 🔊 Phase 2: Sensory & Audio Feedback Engine (Web Audio API)

- [ ] **[P1] Synthesized Tactile Sound FX**
  - **Goal**: Provide audio and haptic feedback without external sound asset dependencies using the Web Audio API.
  - **Details**:
    - **Task Complete Pop**: Crisp harmonic frequency rise on checking off a task.
    - **Defrag Sweep**: Filtered ambient sweep during the end-of-day cleanup animation.
    - **Timer Finish**: Warm dual-chime bell when a Pomodoro or break cycle completes.
    - **Tile Snap / Drag**: Subtle mechanical micro-click when dropping or resizing tiles.
    - **Settings Control**: Global audio mute toggle and volume slider in `SettingsModal`.
  - **Target Files**: `src/utils/audio.ts` (new), `src/components/Tile.tsx`, `src/components/DefragOverlay.tsx`, `src/components/ActiveTimerWidget.tsx`, `src/components/SettingsModal.tsx`.

---

## ⌨️ Phase 3: Power User Ergonomics & Spatial UX

- [ ] **[P1] Global Keyboard Navigation & Hotkey Overlay**
  - **Goal**: Make WorkStash 100% keyboard-navigable for developer flow state.
  - **Details**:
    - `N`: Open New Task modal.
    - `1` / `2` / `3` / `4`: Quick-switch between *All Blocks*, *Solo Focus*, *Urgent First*, and *Admin Sweep*.
    - `D`: Trigger End-of-Day Defrag ritual.
    - `Space`: Play / Pause active timer (when focused or in Shutter).
    - `?`: Open interactive keyboard shortcuts cheat sheet.
  - **Target Files**: `src/App.tsx`, `src/components/HelpModal.tsx`, `src/components/Header.tsx`.

- [ ] **[P2] Drag-and-Drop from Holding Pen directly onto Grid**
  - **Goal**: Allow dragging items directly from the bottom dock into an exact grid location.
  - **Details**:
    - Extend `@dnd-kit` context to cover both `BentoGrid` and `HoldingPenDock`.
    - Dropping an inbox item on the grid automatically calculates space and converts it to an active tile.
  - **Target Files**: `src/components/HoldingPenDock.tsx`, `src/components/BentoGrid.tsx`.

- [ ] **[P2] Search & Category Filtering in Archive Modal**
  - **Goal**: Quickly find and restore completed historical tasks.
  - **Details**:
    - Add a real-time fuzzy search input to the Archive modal.
    - Add category filter chips (*Deep Focus*, *Urgent*, *Quick Admin*) and date range filtering.
  - **Target Files**: `src/components/ArchiveModal.tsx`.

---

## 💾 Phase 4: Data Portability & Safety

- [ ] **[P1] JSON Workspace Export & Import (Backup / Restore)**
  - **Goal**: Allow users to back up their data locally and transfer workspaces between devices without requiring cloud auth.
  - **Details**:
    - **Export**: One-click download of `workstash-backup-YYYY-MM-DD.json` containing tasks, archived items, focus sessions, and activity logs.
    - **Import**: File upload dialog with schema validation and merge/overwrite options.
  - **Target Files**: `src/components/SettingsModal.tsx`, `src/store.ts`.

---

## ⏱ Phase 5: Browser Tab & Background Flow Integration

- [ ] **[P2] Dynamic Tab Title & Favicon Status**
  - **Goal**: Keep users informed of Pomodoro progress when working in other tabs or code editors.
  - **Details**:
    - Update `document.title` with active timer countdown: `(24:18) WorkStash — Task Title`.
    - Change document title to `(DONE ⏰) Pomodoro Complete!` on finish.
    - Flash or badge the browser tab favicon during active timer completion.
  - **Target Files**: `src/components/ActiveTimerWidget.tsx` or a custom hook `useTabTimerTitle.ts`.

---

## 📱 Phase 6: Mobile & Progressive Web App (PWA)

- [ ] **[P2] Adaptive Mobile & Tablet Layout**
  - **Goal**: Provide a seamless touch-friendly experience on phones and iPad/tablets.
  - **Details**:
    - Responsive 2-column or fluid vertical bento layout on viewports `< 768px`.
    - Touch-optimized gesture controls for Focus Shutter and drag re-ordering.
  - **Target Files**: `src/components/BentoGrid.tsx`, `src/components/Tile.tsx`, `src/index.css`.

- [ ] **[P3] PWA Web App Manifest & Offline Service Worker**
  - **Goal**: Make WorkStash installable as a standalone desktop/mobile app with offline caching.
  - **Details**:
    - Add `manifest.webmanifest` with icons and theme colors.
    - Register a lightweight Vite PWA service worker for instant loading without an internet connection.
  - **Target Files**: `public/manifest.json`, `index.html`, `vite.config.ts`.
