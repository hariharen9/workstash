import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskCategory = 'focus' | 'fire' | 'admin' | 'pen';
export type TopologyMode = 'normal' | 'deep' | 'fire' | 'admin';

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number;      // every N units (1 = every day/week/month)
  days: number[];        // 0=Sun..6=Sat, used for weekly
  time: string | null;   // 'HH:MM' 24h local, when the task should surface
  anchorDate: string;    // 'YYYY-MM-DD' — first occurrence anchor
  monthDay?: number;     // 1..31, used for monthly
}

/** Snapshot of undoable state */
interface Snapshot {
  tasks: Task[];
  mode: TopologyMode;
  focusedTaskId: string | null;
  gridLayout: string;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface ActivityLog {
  id: string;
  time: string;
  msg: string;
  type: 'focus' | 'rest' | 'fire' | 'admin' | 'system';
}

/** One completed focus session (pomodoro), used for analytics. */
export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD local
  taskId: string;
  taskTitle: string;
  cat: TaskCategory;
  durationSeconds: number;
}

export interface Task {
  id: string;
  title: string;
  cat: TaskCategory;
  w: number;
  h: number;
  naturalW: number;
  naturalH: number;
  type: string;
  notes?: string;
  subtasks?: Subtask[];
  timer?: { total: number; remaining: number; running: boolean };
  energy?: number;
  completed: boolean;
  archived?: boolean;
  tab?: string;
  parked?: boolean;
  isPen?: boolean;
  items?: string[];
  recurrence?: Recurrence | null;
  nextDue?: string | null;      // ISO datetime of the next occurrence
  dueDate?: string | null;      // ISO datetime the current occurrence became due
  lastCompleted?: string | null; // YYYY-MM-DD
  completionDates?: string[];    // YYYY-MM-DD history for streak math
  dormant?: boolean;            // hidden until nextDue arrives
}

export interface Toast {
  id: string;
  msg: string;
  icon: string;
}

export type GridLayout = '6x4' | '8x4' | '6x5';

export interface PersistedWorkspace {
  mode: TopologyMode;
  focusedTaskId: string | null;
  tasks: Task[];
  activityLogs: ActivityLog[];
  focusSessions: FocusSession[];
  gridLayout: GridLayout;
  morningIntentDate: string | null;
  notificationPermission: NotificationPermission;
}

interface AppState {
  mode: TopologyMode;
  focusedTaskId: string | null;
  tasks: Task[];
  shutterOpen: string | null;
  toasts: Toast[];
  activityLogs: ActivityLog[];
  focusSessions: FocusSession[];
  gridLayout: GridLayout;

  morningIntentDate: string | null;
  setMorningIntentShown: () => void;

  undoStack: Snapshot[];
  redoStack: Snapshot[];
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => void;

  setGridLayout: (layout: GridLayout) => void;
  logActivity: (msg: string, type: ActivityLog['type']) => void;

  addTile: (title: string, cat: TaskCategory, w: number, h: number) => void;
  addRecurringTile: (title: string, cat: TaskCategory, w: number, h: number, recurrence: Recurrence) => void;
  updateTitle: (id: string, title: string) => void;
  updateCategory: (id: string, cat: TaskCategory) => void;
  updateRecurrence: (id: string, recurrence: Recurrence) => void;
  archiveTask: (id: string) => void;
  toggleCompleteTask: (id: string) => void;
  restoreTask: (id: string) => void;
  refreshRecurringTasks: () => void;
  snoozeTask: (id: string, hours: number) => void;
  completeTaskNow: (id: string) => void;
  wakeRecurringTask: (id: string) => void;
  changeTopology: (mode: TopologyMode) => void;
  openShutter: (id: string) => void;
  closeShutter: () => void;
  setTileSize: (id: string, w: number, h: number) => void;
  setTab: (id: string, tab: string) => void;
  updateNotes: (id: string, text: string) => void;
  toggleSubtask: (id: string, subtaskId: string) => void;
  removeSubtask: (id: string, subtaskId: string) => void;
  addSubtask: (id: string, text: string) => void;
  setTimerRunning: (id: string, running: boolean) => void;
  tickTimer: (id: string) => void;
  recordStandaloneSession: (durationSeconds: number) => void;
  resetTimer: (id: string) => void;
  adjustTimer: (id: string, deltaSeconds: number) => void;
  setTimerDuration: (id: string, totalSeconds: number) => void;
  setEnergy: (id: string, val: number) => void;
  addPenItem: (id: string, text: string) => void;
  removePenItem: (id: string, index: number) => void;
  promotePenItem: (penId: string, index: number) => void;
  runDefrag: () => void;
  setFocusedTask: (id: string) => void;
  addToast: (msg: string, icon?: string) => void;
  removeToast: (id: string) => void;
  isHoveringTask: boolean;
  setIsHoveringTask: (val: boolean) => void;
  reorderTasks: (sourceId: string, targetId: string) => void;
  resetWorkspace: () => void;
  hydrateCloudWorkspace: (workspace: PersistedWorkspace) => void;
}

const STORAGE_KEY = 'workstash-v1';

const uid = () => Math.random().toString(36).slice(2, 9);

export const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ---------------------------------------------------------------------------
   Time & recurrence engine
   All dates are stored as local-time ISO strings so a task scheduled for
   "09:00" stays at 09:00 regardless of timezone shifts or daylight savings.
--------------------------------------------------------------------------- */

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function dateKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function isoLocal(d: Date): string {
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function parseIsoLocal(s: string): Date {
  const [datePart, timePart] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss] = (timePart || '00:00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function daysBetween(aKey: string, bKey: string): number {
  const a = startOfDay(parseDateKey(aKey));
  const b = startOfDay(parseDateKey(bKey));
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function defaultRecurrence(): Recurrence {
  return {
    frequency: 'daily',
    interval: 1,
    days: [],
    time: '09:00',
    anchorDate: todayKey(),
    monthDay: 1,
  };
}

export function formatRecurrenceTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

export function recurrenceLabel(r: Recurrence): string {
  const time = r.time ? ` at ${formatRecurrenceTime(r.time)}` : '';
  const every = (unit: string) => (r.interval > 1 ? `Every ${r.interval} ${unit}` : `Every ${unit.slice(0, -1)}`);
  switch (r.frequency) {
    case 'daily':
      return `${every('days')}${time}`;
    case 'weekdays':
      return `${r.interval > 1 ? `Every ${r.interval} weekdays` : 'Every weekday'}${time}`;
    case 'weekly': {
      const days = r.days.length
        ? r.days.map(d => DAY_NAMES[d]).join(', ')
        : 'week';
      return `${r.interval > 1 ? `Every ${r.interval} weeks` : 'Weekly'} on ${days}${time}`;
    }
    case 'monthly':
      return `${every('months')} on day ${r.monthDay ?? 1}${time}`;
  }
}

function weekdayCountBetween(anchor: Date, d: Date): number {
  let count = 0;
  const cursor = new Date(anchor);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor.getTime() <= d.getTime()) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function matchesRecurrenceDay(r: Recurrence, date: Date, anchor: Date): boolean {
  const dow = date.getDay();
  switch (r.frequency) {
    case 'daily':
      return daysBetween(dateKeyOf(anchor), dateKeyOf(date)) % Math.max(1, r.interval) === 0;
    case 'weekdays':
      if (dow === 0 || dow === 6) return false;
      return weekdayCountBetween(anchor, date) % Math.max(1, r.interval) === 0;
    case 'weekly':
      if (r.days.length > 0 && !r.days.includes(dow)) return false;
      return Math.floor(daysBetween(dateKeyOf(anchor), dateKeyOf(date)) / 7) % Math.max(1, r.interval) === 0;
    case 'monthly': {
      const target = Math.min(r.monthDay ?? 1, daysInMonth(date));
      if (date.getDate() !== target) return false;
      return monthDiff(anchor, date) % Math.max(1, r.interval) === 0;
    }
  }
}

/** Next occurrence strictly after `from`, or null if none within 2 years. */
export function nextOccurrence(r: Recurrence, from: Date = new Date()): Date | null {
  const anchor = parseDateKey(r.anchorDate || dateKeyOf(from));
  const start = startOfDay(from);
  start.setDate(start.getDate() + 1);

  for (let i = 0; i < 730; i++) {
    const candidate = addDays(start, i);
    if (matchesRecurrenceDay(r, candidate, anchor)) {
      if (r.time) {
        const [h, m] = r.time.split(':').map(Number);
        candidate.setHours(h, m, 0, 0);
      } else {
        candidate.setHours(0, 0, 0, 0);
      }
      return candidate;
    }
  }
  return null;
}

/** Consecutive occurrences completed, ending today or yesterday. */
export function streakForTask(t: Task): number {
  if (!t.recurrence) return 0;
  const dates = new Set(t.completionDates || []);
  if (dates.size === 0) return 0;

  const anchor = parseDateKey(t.recurrence.anchorDate);
  let cursor = startOfDay(new Date());

  // A streak can still be alive if the most recent completion was yesterday.
  if (!dates.has(dateKeyOf(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dates.has(dateKeyOf(cursor))) return 0;
  }

  let streak = 0;
  while (cursor.getTime() >= anchor.getTime()) {
    if (matchesRecurrenceDay(t.recurrence, cursor, anchor)) {
      if (dates.has(dateKeyOf(cursor))) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function applyTopology(tasks: Task[], mode: TopologyMode, focusedTaskId: string | null, gridLayout: string) {
  let newFocusedId = focusedTaskId;
  const cols = gridLayout === '8x4' ? 8 : 6;
  const rows = gridLayout === '6x5' ? 5 : 4;

  tasks.forEach(t => {
    t.parked = false;
    if (t.isPen || t.dormant) return;
    if (mode === 'normal') {
      t.w = t.naturalW; t.h = t.naturalH;
    } else if (mode === 'deep') {
      if (t.id === newFocusedId) {
        t.w = Math.min(4, cols); t.h = Math.min(3, rows);
      } else {
        t.w = 1; t.h = 1; t.parked = true;
      }
    } else if (mode === 'fire') {
      t.w = Math.min(t.naturalW, 2); t.h = 1;
    } else if (mode === 'admin') {
      if (t.cat === 'admin') { t.w = 1; t.h = 1; }
      else { t.w = 1; t.h = 1; t.parked = true; }
    }
  });

  if (mode === 'deep' && !newFocusedId) {
    const candidate = tasks.find(t => !t.isPen && !t.completed && t.cat === 'focus');
    if (candidate) {
      newFocusedId = candidate.id;
      return applyTopology(tasks, mode, newFocusedId, gridLayout);
    }
  }

  if (mode === 'fire') {
    const order: Record<string, number> = { fire: 0, focus: 1, admin: 2, pen: 3 };
    tasks.sort((a, b) => (order[a.cat] ?? 9) - (order[b.cat] ?? 9));
  }

  return { tasks, newFocusedId };
}

function createSeedTasks(): Task[] {
  return [
    // 3×2 — split-pane deep focus workspace
    { id: uid(), title: 'Design token audit for WorkStash', cat: 'focus', w: 3, h: 2, naturalW: 3, naturalH: 2, type: 'deep',
      notes: '// reconcile elevated vs elevated-hi\n// check contrast on amber badges', subtasks: [
        { id: uid(), text: 'Pull palette into CSS vars', done: true },
        { id: uid(), text: 'Recheck focus ring contrast', done: false },
      ], timer: { total: 1500, remaining: 1500, running: false }, energy: 3, completed: false, tab: 'notes' },
    // 2×2 — tabbed urgent workspace
    { id: uid(), title: 'Prod error spike — /checkout 500s', cat: 'fire', w: 2, h: 2, naturalW: 2, naturalH: 2, type: 'focus',
      notes: 'TypeError: Cannot read properties of undefined\n  at validateCart (checkout.ts:88)', subtasks: [
        { id: uid(), text: 'Reproduce locally', done: false },
        { id: uid(), text: 'Check deploy logs', done: false },
      ], timer: { total: 900, remaining: 900, running: false }, energy: 4, completed: false, tab: 'notes' },
    // 3×1 — slim wide checklist strip
    { id: uid(), title: 'Sprint planning prep', cat: 'focus', w: 3, h: 1, naturalW: 3, naturalH: 1, type: 'standard',
      notes: '', subtasks: [
        { id: uid(), text: 'Review backlog items', done: false },
        { id: uid(), text: 'Estimate story points', done: false },
        { id: uid(), text: 'Draft sprint goal', done: false },
      ], energy: 2, completed: false },
    // 1×2 — tall narrow column
    { id: uid(), title: 'Review PR #482', cat: 'focus', w: 1, h: 2, naturalW: 1, naturalH: 2, type: 'standard',
      notes: '', subtasks: [
        { id: uid(), text: 'Check migration rollback', done: false },
        { id: uid(), text: 'Test edge cases', done: false },
      ], energy: 2, completed: false },
    { id: uid(), title: 'Approve expense report', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Reply: vendor contract q\'s', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Book flight for offsite', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Holding Pen', cat: 'pen', w: 2, h: 1, naturalW: 2, naturalH: 1, type: 'pen', isPen: true, items: ['Slack: check w/ Dana re: staging creds'], completed: false },
  ];
}

export function buildEmptyWorkspace(): PersistedWorkspace {
  const pen: Task = {
    id: uid(),
    title: 'Holding Pen',
    cat: 'pen',
    w: 2,
    h: 1,
    naturalW: 2,
    naturalH: 1,
    type: 'pen',
    isPen: true,
    items: [],
    completed: false,
  };
  return {
    mode: 'normal',
    focusedTaskId: null,
    tasks: [pen],
    activityLogs: [
      {
        id: uid(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        msg: 'Workspace created',
        type: 'system',
      },
    ],
    focusSessions: [],
    gridLayout: '6x4',
    morningIntentDate: null,
    notificationPermission:
      (typeof Notification !== 'undefined' ? Notification.permission : 'denied') as NotificationPermission,
  };
}

export function serializeWorkspaceState(state: {
  mode: TopologyMode;
  focusedTaskId: string | null;
  tasks: Task[];
  activityLogs: ActivityLog[];
  focusSessions: FocusSession[];
  gridLayout: GridLayout;
  morningIntentDate: string | null;
  notificationPermission: NotificationPermission;
}): PersistedWorkspace {
  return {
    mode: state.mode,
    focusedTaskId: state.focusedTaskId,
    tasks: state.tasks.map(t =>
      t.timer?.running
        ? { ...t, timer: { ...t.timer, running: false } }
        : t
    ),
    activityLogs: state.activityLogs.slice(0, 100),
    focusSessions: state.focusSessions.slice(0, 500),
    gridLayout: state.gridLayout,
    morningIntentDate: state.morningIntentDate,
    notificationPermission: state.notificationPermission,
  };
}

function buildInitialState() {
  const seed = createSeedTasks();
  const { tasks, newFocusedId } = applyTopology(seed, 'normal', null, '6x4');
  return {
    mode: 'normal' as TopologyMode,
    focusedTaskId: newFocusedId,
    tasks,
    shutterOpen: null as string | null,
    toasts: [] as Toast[],
    gridLayout: '6x4' as GridLayout,
    morningIntentDate: null,
    undoStack: [] as Snapshot[],
    redoStack: [] as Snapshot[],
    notificationPermission: (typeof Notification !== 'undefined' ? Notification.permission : 'denied') as NotificationPermission,
    activityLogs: [
      { id: uid(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), msg: 'Workspace initialized', type: 'system' as const }
    ],
    focusSessions: [] as FocusSession[],
    isHoveringTask: false,
  };
}

const initial = buildInitialState();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      pushSnapshot: () => {
        const state = get();
        const snapshot: Snapshot = {
          tasks: JSON.parse(JSON.stringify(state.tasks)),
          mode: state.mode,
          focusedTaskId: state.focusedTaskId,
          gridLayout: state.gridLayout,
        };
        set({ undoStack: [...state.undoStack.slice(-49), snapshot], redoStack: [] });
      },

      undo: () => {
        const state = get();
        if (state.undoStack.length === 0) return;
        const prev = state.undoStack[state.undoStack.length - 1];
        const current: Snapshot = {
          tasks: JSON.parse(JSON.stringify(state.tasks)),
          mode: state.mode,
          focusedTaskId: state.focusedTaskId,
          gridLayout: state.gridLayout,
        };
        set({
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, current],
          tasks: prev.tasks,
          mode: prev.mode,
          focusedTaskId: prev.focusedTaskId,
          gridLayout: prev.gridLayout as GridLayout,
        });
      },

      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;
        const next = state.redoStack[state.redoStack.length - 1];
        const current: Snapshot = {
          tasks: JSON.parse(JSON.stringify(state.tasks)),
          mode: state.mode,
          focusedTaskId: state.focusedTaskId,
          gridLayout: state.gridLayout,
        };
        set({
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, current],
          tasks: next.tasks,
          mode: next.mode,
          focusedTaskId: next.focusedTaskId,
          gridLayout: next.gridLayout as GridLayout,
        });
      },

      requestNotificationPermission: () => {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'default') {
          Notification.requestPermission().then((perm) => {
            set({ notificationPermission: perm });
          });
        }
      },

      setMorningIntentShown: () => {
        const today = todayKey();
        set({ morningIntentDate: today });
      },

      setIsHoveringTask: (val) => set({ isHoveringTask: val }),

      setGridLayout: (layout) => set((state) => {
        // Keep completed tasks; only re-apply topology to active ones' sizes
        const nextTasks = JSON.parse(JSON.stringify(state.tasks)) as Task[];
        const result = applyTopology(nextTasks, 'normal', null, layout);
        get().logActivity(`Grid layout set to ${layout}`, 'system');
        return { gridLayout: layout, tasks: result.tasks, mode: 'normal', focusedTaskId: null };
      }),

      logActivity: (msg, type) => set((state) => {
        const newLog = {
          id: uid(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          msg,
          type
        };
        return { activityLogs: [newLog, ...state.activityLogs].slice(0, 100) };
      }),

      addToast: (msg, icon = '✓') => set((state) => ({
        toasts: [...state.toasts, { id: uid(), msg, icon }]
      })),

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      addTile: (title, cat, w = 2, h = 1) => set((state) => {
        get().pushSnapshot();
        const newTask: Task = {
          id: uid(), title, cat, w, h, naturalW: w, naturalH: h, type: 'task',
          notes: '', subtasks: [], timer: { total: 1500, remaining: 1500, running: false },
          energy: 3, completed: false, tab: 'notes'
        };
        setTimeout(() => get().logActivity(`Created "${title}"`, cat === 'focus' ? 'focus' : cat === 'fire' ? 'fire' : 'admin'), 0);
        return { tasks: [...state.tasks, newTask] };
      }),

      addRecurringTile: (title, cat, w = 1, h = 1, recurrence) => set((state) => {
        get().pushSnapshot();
        const due = nextOccurrence(recurrence);
        const newTask: Task = {
          id: uid(), title, cat, w, h, naturalW: w, naturalH: h, type: 'task',
          notes: '', subtasks: [], timer: { total: 1500, remaining: 1500, running: false },
          energy: cat === 'admin' ? 1 : 2, completed: false, tab: 'notes',
          recurrence, nextDue: due ? isoLocal(due) : null,
          dueDate: due ? isoLocal(due) : null,
          lastCompleted: null, completionDates: [], dormant: true,
        };
        setTimeout(() => get().logActivity(`Created recurring task "${title}" — ${recurrenceLabel(recurrence)}`, 'system'), 0);
        return { tasks: [...state.tasks, newTask] };
      }),

      updateRecurrence: (id, recurrence) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        get().pushSnapshot();
        const due = nextOccurrence(recurrence);
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            recurrence,
            nextDue: due ? isoLocal(due) : null,
            dueDate: due ? isoLocal(due) : null,
            dormant: true,
            completed: false,
            archived: false,
          } : t)
        }));
        get().logActivity(`Updated recurrence for "${task.title}"`, 'system');
      },

      snoozeTask: (id, hours) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        get().pushSnapshot();
        const now = new Date();
        const next = new Date(now.getTime() + hours * 3600000);
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            dormant: true,
            completed: false,
            archived: false,
            dueDate: isoLocal(next),
            nextDue: isoLocal(next),
          } : t)
        }));
        get().addToast(`Snoozed "${task.title}" until ${formatRecurrenceTime(`${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`)}`, '⏳');
        get().logActivity(`Snoozed "${task.title}"`, 'system');
      },

      completeTaskNow: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        get().pushSnapshot();

        if (task.recurrence) {
          const now = new Date();
          const due = nextOccurrence(task.recurrence, now);
          const today = todayKey();
          const completionDates = Array.from(new Set([...(task.completionDates || []), today]));
          const newStreak = streakForTask({ ...task, completionDates });
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? {
              ...t,
              completed: false,
              archived: false,
              dormant: true,
              lastCompleted: today,
              completionDates,
              dueDate: due ? isoLocal(due) : null,
              nextDue: due ? isoLocal(due) : null,
              timer: t.timer ? { ...t.timer, running: false } : t.timer,
            } : t)
          }));
          get().addToast(`✓ "${task.title}" — next ${task.recurrence.time ? `at ${formatRecurrenceTime(task.recurrence.time)}` : 'occurrence'}. Streak ${newStreak} 🔥`, '⟳');
          get().logActivity(`Completed recurring "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
          return;
        }

        // Non-recurring: standard complete
        get().logActivity(`Completed "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            completed: true,
            w: 1,
            h: 1,
            timer: t.timer ? { ...t.timer, running: false } : t.timer
          } : t)
        }));
      },

      wakeRecurringTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task?.recurrence) return;
        get().pushSnapshot();
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            dormant: false,
            completed: false,
            archived: false,
            w: t.naturalW,
            h: t.naturalH,
          } : t)
        }));
        get().addToast(`"${task.title}" brought onto the grid now`, '⟳');
      },

      refreshRecurringTasks: () => {
        const state = get();
        const now = new Date();
        let changed = false;
        const nextTasks = state.tasks.map(t => {
          if (!t.recurrence || t.completed || t.archived) return t;

          const dueDate = t.dueDate ? parseIsoLocal(t.dueDate) : null;
          const nextDue = t.nextDue ? parseIsoLocal(t.nextDue) : null;
          const isDue = (dueDate && dueDate.getTime() <= now.getTime())
            || (nextDue && nextDue.getTime() <= now.getTime());

          if (t.dormant && isDue) {
            changed = true;
            return {
              ...t,
              dormant: false,
              completed: false,
              archived: false,
              w: t.naturalW,
              h: t.naturalH,
            };
          }
          return t;
        });

        if (changed) set({ tasks: nextTasks });
      },

      updateTitle: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        get().pushSnapshot();
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, title: trimmed } : t)
        }));
      },

      updateCategory: (id, cat) => {
        if (cat === 'pen') return;
        const task = get().tasks.find(t => t.id === id);
        if (!task || task.isPen) return;
        get().pushSnapshot();
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, cat } : t)
        }));
        get().logActivity(`Moved "${task.title}" → ${cat}`, cat === 'focus' ? 'focus' : cat === 'fire' ? 'fire' : 'admin');
      },

      archiveTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          get().pushSnapshot();
          get().logActivity(`Archived "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
        }
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, completed: true, archived: true, timer: t.timer ? { ...t.timer, running: false } : t.timer } : t)
        }));
      },

      toggleCompleteTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        if (task.recurrence && !task.completed) {
          get().completeTaskNow(id);
          return;
        }

        get().pushSnapshot();
        const nextCompleted = !task.completed;
        const TOTAL_CELLS = get().gridLayout === '8x4' ? 32 : get().gridLayout === '6x5' ? 30 : 24;

        if (nextCompleted) {
          get().logActivity(`Completed "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? {
              ...t,
              completed: true,
              w: 1,
              h: 1,
              timer: t.timer ? { ...t.timer, running: false } : t.timer
            } : t)
          }));
        } else {
          // Reopening / Undone -> attempt to restore natural dimensions
          const currentOccupied = occupiedCells(get().tasks);
          const usedWithoutThis = Math.max(0, currentOccupied - 1);
          const naturalCells = task.naturalW * task.naturalH;

          let targetW = task.naturalW;
          let targetH = task.naturalH;

          if (usedWithoutThis + naturalCells > TOTAL_CELLS) {
            targetW = 1;
            targetH = 1;
            get().addToast(`Reopened "${task.title}" as 1×1 — grid space is tight`, '↩');
          } else {
            get().addToast(`Reopened "${task.title}" — restored to ${targetW}×${targetH}`, '↩');
          }

          get().logActivity(`Reopened "${task.title}"`, 'system');

          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? {
              ...t,
              completed: false,
              w: targetW,
              h: targetH,
            } : t)
          }));
        }
      },

      restoreTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        const TOTAL_CELLS = get().gridLayout === '8x4' ? 32 : get().gridLayout === '6x5' ? 30 : 24;
        const used = occupiedCells(get().tasks);
        const taskCells = task.naturalW * task.naturalH;

        // Try to fit at natural size first, then shrink to 1×1
        let restoredW = task.naturalW;
        let restoredH = task.naturalH;

        if (used + taskCells > TOTAL_CELLS) {
          if (used + 1 > TOTAL_CELLS) {
            get().addToast('Grid full — defrag or resize a block first', '⚠');
            return;
          }
          restoredW = 1;
          restoredH = 1;
          get().addToast(`Restored "${task.title}" as 1×1 — grid is tight`, '↩');
        } else {
          get().addToast(`Restored "${task.title}"`, '↩');
        }

        get().pushSnapshot();
        get().logActivity(`Restored "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            completed: false,
            archived: false,
            w: restoredW,
            h: restoredH,
            naturalW: restoredW,
            naturalH: restoredH,
          } : t)
        }));
      },

      changeTopology: (mode) => set((state) => {
        get().pushSnapshot();
        const nextTasks = JSON.parse(JSON.stringify(state.tasks));
        let nextFocusId = mode !== 'deep' ? null : state.focusedTaskId;
        const result = applyTopology(nextTasks, mode, nextFocusId, state.gridLayout);
        const labels: Record<TopologyMode, string> = {
          normal: 'Switched to All Blocks',
          deep: 'Switched to Solo Focus',
          fire: 'Switched to Urgent First',
          admin: 'Switched to Admin Sweep',
        };
        setTimeout(() => get().logActivity(labels[mode], 'system'), 0);
        return { mode, tasks: result.tasks, focusedTaskId: result.newFocusedId };
      }),

      setFocusedTask: (id) => set((state) => {
        if (state.mode !== 'deep') return {};
        get().pushSnapshot();
        const nextTasks = JSON.parse(JSON.stringify(state.tasks));
        const result = applyTopology(nextTasks, 'deep', id, state.gridLayout);
        return { tasks: result.tasks, focusedTaskId: id };
      }),

      openShutter: (id) => set({ shutterOpen: id }),
      closeShutter: () => set({ shutterOpen: null }),

      setTileSize: (id, w, h) => set((state) => {
        get().pushSnapshot();
        return {
          tasks: state.tasks.map(t => t.id === id ? { ...t, w, h, naturalW: w, naturalH: h } : t)
        };
      }),

      setTab: (id, tab) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, tab } : t)
      })),

      updateNotes: (id, text) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, notes: text } : t)
      })),

      toggleSubtask: (id, subtaskId) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? {
          ...t,
          subtasks: t.subtasks?.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s)
        } : t)
      })),

      removeSubtask: (id, subtaskId) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? {
          ...t,
          subtasks: t.subtasks?.filter(s => s.id !== subtaskId)
        } : t)
      })),

      addSubtask: (id, text) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? {
          ...t,
          subtasks: [...(t.subtasks || []), { id: uid(), text, done: false }]
        } : t)
      })),

      setTimerRunning: (id, running) => set((state) => {
        // Only one timer runs at a time
        const tasks = state.tasks.map(t => {
          if (!t.timer) return t;
          if (t.id === id) {
            return { ...t, timer: { ...t.timer, running } };
          }
          if (running && t.timer.running) {
            return { ...t, timer: { ...t.timer, running: false } };
          }
          return t;
        });
        return { tasks };
      }),

      tickTimer: (id) => set((state) => {
        const finished: FocusSession[] = [];
        const newTasks = state.tasks.map(t => {
          if (t.id === id && t.timer && t.timer.running && t.timer.remaining > 0) {
            const nextRemaining = t.timer.remaining - 1;
            if (nextRemaining === 0) {
              finished.push({
                id: uid(),
                date: todayKey(),
                taskId: t.id,
                taskTitle: t.title,
                cat: t.cat,
                durationSeconds: t.timer.total,
              });
            }
            return {
              ...t,
              timer: { ...t.timer, remaining: nextRemaining, running: nextRemaining > 0 }
            };
          }
          return t;
        });

        if (finished.length > 0) {
          const session = finished[0];
          setTimeout(() => {
            get().addToast(`Timer done — "${session.taskTitle}"`, '⏰');
            get().logActivity(`Completed timer for "${session.taskTitle}"`, 'focus');
            // Browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('Pomodoro complete — WorkStash', {
                body: `"${session.taskTitle}" — ${Math.floor(session.durationSeconds / 60)}m finished`,
                icon: '/favicon.svg',
              });
            }
          }, 0);
          return {
            tasks: newTasks,
            focusSessions: [...finished, ...state.focusSessions],
          };
        }

        return { tasks: newTasks };
      }),

      recordStandaloneSession: (durationSeconds) => set((state) => {
        const session: FocusSession = {
          id: uid(),
          date: todayKey(),
          taskId: 'standalone',
          taskTitle: 'Standalone focus session',
          cat: 'focus',
          durationSeconds,
        };
        setTimeout(() => {
          get().addToast('Focus session recorded', '⏰');
          get().logActivity('Completed a standalone focus session', 'focus');
        }, 0);
        return { focusSessions: [session, ...state.focusSessions] };
      }),

      resetTimer: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? {
          ...t,
          timer: t.timer ? { ...t.timer, remaining: t.timer.total, running: false } : t.timer
        } : t)
      })),

      adjustTimer: (id, deltaSeconds) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id && t.timer) {
            const newTotal = Math.max(60, Math.min(7200, t.timer.total + deltaSeconds));
            // Only rewrite remaining when timer hasn't started (or finished)
            const untouched = t.timer.remaining === t.timer.total || t.timer.remaining === 0;
            return {
              ...t,
              timer: {
                ...t.timer,
                total: newTotal,
                remaining: untouched ? newTotal : Math.min(t.timer.remaining, newTotal),
                running: false,
              }
            };
          }
          return t;
        })
      })),

      setTimerDuration: (id, totalSeconds) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id && t.timer) {
            const total = Math.max(60, Math.min(7200, totalSeconds));
            return { ...t, timer: { total, remaining: total, running: false } };
          }
          return t;
        })
      })),

      setEnergy: (id, val) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, energy: val } : t)
      })),

      addPenItem: (id, text) => set((state) => {
        get().pushSnapshot();
        return {
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            items: [...(t.items || []), text]
          } : t)
        };
      }),

      removePenItem: (id, index) => set((state) => {
        get().pushSnapshot();
        return {
          tasks: state.tasks.map(t => {
            if (t.id === id && t.items) {
              const newItems = [...t.items];
              newItems.splice(index, 1);
              return { ...t, items: newItems };
            }
            return t;
          })
        };
      }),

      promotePenItem: (penId, index) => {
        const pen = get().tasks.find(t => t.id === penId && t.isPen);
        const text = pen?.items?.[index];
        if (!text) return;

        const occupied = occupiedCells(get().tasks);
        const total = get().gridLayout === '8x4' ? 32 : get().gridLayout === '6x5' ? 30 : 24;
        if (occupied + 1 > total) {
          get().addToast('Not enough grid space — free a cell first', '⚠');
          return;
        }

        get().pushSnapshot();
        get().removePenItem(penId, index);
        get().addTile(text, 'admin', 1, 1);
        get().addToast(`Promoted to grid: "${text}"`, '↗');
      },

      runDefrag: () => set((state) => {
        get().pushSnapshot();
        const completedTasks = state.tasks.filter(t => !t.archived && t.completed);
        const completedCount = completedTasks.length;
        
        // Mark all completed active tasks as archived
        const nextTasks = state.tasks.map(t => {
          if (!t.archived && t.completed) {
            return { ...t, archived: true, timer: t.timer ? { ...t.timer, running: false } : t.timer };
          }
          return t;
        });
        
        const activeUnarchived = nextTasks.filter(t => !t.archived);
        const result = applyTopology(activeUnarchived, 'normal', null, state.gridLayout);
        
        const finalTasks = nextTasks.map(t => {
          if (t.archived) return t;
          const found = result.tasks.find(r => r.id === t.id);
          return found || t;
        });

        setTimeout(() => get().logActivity(`Defrag archived ${completedCount} completed block${completedCount === 1 ? '' : 's'}`, 'system'), 0);
        return { tasks: finalTasks, mode: 'normal', focusedTaskId: null };
      }),

      reorderTasks: (sourceId, targetId) => set((state) => {
        if (sourceId === targetId) return state;
        get().pushSnapshot();
        const tasks = [...state.tasks];
        const sourceIdx = tasks.findIndex(t => t.id === sourceId);
        const targetIdx = tasks.findIndex(t => t.id === targetId);
        if (sourceIdx === -1 || targetIdx === -1) return state;

        const [movedTask] = tasks.splice(sourceIdx, 1);
        tasks.splice(targetIdx, 0, movedTask);

        return { tasks };
      }),

      resetWorkspace: () => {
        const fresh = buildInitialState();
        set({
          ...fresh,
          toasts: [],
          shutterOpen: null,
        });
        get().addToast('Workspace reset to defaults', '⟳');
      },

      hydrateCloudWorkspace: (workspace) => {
        const tasks = (workspace.tasks || []).map(t => ({
          ...t,
          archived: t.archived ?? (t.completed ? true : false),
          timer: t.timer?.running ? { ...t.timer, running: false } : t.timer
        }));
        set({
          mode: workspace.mode || 'normal',
          focusedTaskId: workspace.focusedTaskId ?? null,
          tasks,
          activityLogs: Array.isArray(workspace.activityLogs) ? workspace.activityLogs : [],
          focusSessions: Array.isArray(workspace.focusSessions) ? workspace.focusSessions : [],
          gridLayout: workspace.gridLayout || '6x4',
          morningIntentDate: workspace.morningIntentDate ?? null,
          notificationPermission: workspace.notificationPermission || 'default',
          toasts: [],
          shutterOpen: null,
          undoStack: [],
          redoStack: [],
          isHoveringTask: false,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => serializeWorkspaceState({
        mode: state.mode,
        focusedTaskId: state.focusedTaskId,
        tasks: state.tasks,
        activityLogs: state.activityLogs,
        focusSessions: state.focusSessions,
        gridLayout: state.gridLayout,
        morningIntentDate: state.morningIntentDate,
        notificationPermission: state.notificationPermission,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        if (!p || !Array.isArray(p.tasks) || p.tasks.length === 0) {
          return current;
        }
        // Always stop running timers after reload; ensure archived flag is set
        const tasks = p.tasks.map(t => ({
          ...t,
          archived: t.archived ?? (t.completed ? true : false),
          timer: t.timer?.running ? { ...t.timer, running: false } : t.timer
        }));
        return {
          ...current,
          ...p,
          tasks,
          toasts: [],
          shutterOpen: null,
          isHoveringTask: false,
          undoStack: [],
          redoStack: [],
          focusSessions: Array.isArray(p.focusSessions) ? p.focusSessions : [],
          activityLogs: Array.isArray(p.activityLogs) ? p.activityLogs : current.activityLogs,
        };
      },
    }
  )
);

export function occupiedCells(tasks: Task[]): number {
  return tasks.reduce((sum, t) => {
    if (t.archived || t.isPen || t.dormant) return sum;
    return sum + (t.parked ? 1 : t.w * t.h);
  }, 0);
}

/** Helpers for analytics views — pure functions over store data. */
export function sessionsByDay(sessions: FocusSession[], days = 56): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.date, (map.get(s.date) || 0) + 1);
  }
  const result: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({ date: key, count: map.get(key) || 0 });
  }
  return result;
}

export function energyAllocation(tasks: Task[]): {
  focus: number;
  fire: number;
  admin: number;
  total: number;
  totalHours: number;
} {
  const active = tasks.filter(t => !t.completed && !t.isPen && !t.dormant);
  let focus = 0, fire = 0, admin = 0;
  for (const t of active) {
    const e = t.energy ?? (t.cat === 'admin' ? 1 : 2);
    if (t.cat === 'focus') focus += e;
    else if (t.cat === 'fire') fire += e;
    else if (t.cat === 'admin') admin += e;
  }
  const total = focus + fire + admin;
  // Rough cognitive hours: each energy unit ≈ 0.5h of budgeted attention
  const totalHours = total * 0.5;
  return { focus, fire, admin, total, totalHours };
}

export function sessionStats(sessions: FocusSession[]) {
  const totalSeconds = sessions.reduce((s, x) => s + x.durationSeconds, 0);
  return {
    count: sessions.length,
    totalSeconds,
    totalHours: totalSeconds / 3600,
  };
}
