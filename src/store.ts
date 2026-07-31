import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskCategory = 'focus' | 'fire' | 'admin' | 'pen';
export type TopologyMode = 'normal' | 'deep' | 'fire' | 'admin';

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
  tab?: string;
  parked?: boolean;
  isPen?: boolean;
  items?: string[];
}

export interface Toast {
  id: string;
  msg: string;
  icon: string;
}

export type GridLayout = '6x4' | '8x4' | '6x5';

interface AppState {
  mode: TopologyMode;
  focusedTaskId: string | null;
  tasks: Task[];
  shutterOpen: string | null;
  toasts: Toast[];
  activityLogs: ActivityLog[];
  focusSessions: FocusSession[];
  gridLayout: GridLayout;

  setGridLayout: (layout: GridLayout) => void;
  logActivity: (msg: string, type: ActivityLog['type']) => void;

  addTile: (title: string, cat: TaskCategory, w: number, h: number) => void;
  updateTitle: (id: string, title: string) => void;
  updateCategory: (id: string, cat: TaskCategory) => void;
  archiveTask: (id: string) => void;
  restoreTask: (id: string) => void;
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
}

const STORAGE_KEY = 'workstash-v1';

const uid = () => Math.random().toString(36).slice(2, 9);

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function applyTopology(tasks: Task[], mode: TopologyMode, focusedTaskId: string | null, gridLayout: string) {
  let newFocusedId = focusedTaskId;
  const cols = gridLayout === '8x4' ? 8 : 6;
  const rows = gridLayout === '6x5' ? 5 : 4;

  tasks.forEach(t => {
    t.parked = false;
    if (t.isPen) return;
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
    { id: uid(), title: 'Design token audit for WorkStash', cat: 'focus', w: 3, h: 2, naturalW: 3, naturalH: 2, type: 'deep',
      notes: '// reconcile elevated vs elevated-hi\n// check contrast on amber badges', subtasks: [
        { id: uid(), text: 'Pull palette into CSS vars', done: true },
        { id: uid(), text: 'Recheck focus ring contrast', done: false },
      ], timer: { total: 1500, remaining: 1500, running: false }, energy: 3, completed: false, tab: 'notes' },
    { id: uid(), title: 'Prod error spike — /checkout 500s', cat: 'fire', w: 2, h: 2, naturalW: 2, naturalH: 2, type: 'focus',
      notes: 'TypeError: Cannot read properties of undefined\n  at validateCart (checkout.ts:88)', subtasks: [
        { id: uid(), text: 'Reproduce locally', done: false },
      ], timer: { total: 900, remaining: 900, running: false }, energy: 4, completed: false, tab: 'notes' },
    { id: uid(), title: 'Review Priya\'s PR #482', cat: 'focus', w: 2, h: 1, naturalW: 2, naturalH: 1, type: 'standard',
      notes: '', subtasks: [{ id: uid(), text: 'Check migration rollback', done: false }], energy: 2, completed: false },
    { id: uid(), title: 'Approve expense report', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Reply: vendor contract q\'s', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Standup notes', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Book flight for offsite', cat: 'admin', w: 1, h: 1, naturalW: 1, naturalH: 1, type: 'admin', completed: false },
    { id: uid(), title: 'Holding Pen', cat: 'pen', w: 2, h: 1, naturalW: 2, naturalH: 1, type: 'pen', isPen: true, items: ['Slack: check w/ Dana re: staging creds'], completed: false },
  ];
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

      addTile: (title, cat, w, h) => set((state) => {
        const need = w * h;
        const type = need <= 1 ? 'admin' : need <= 2 ? 'standard' : need <= 4 ? 'focus' : 'deep';
        const newTask: Task = {
          id: uid(), title, cat, w, h, naturalW: w, naturalH: h, type,
          notes: '', subtasks: [], timer: { total: 1500, remaining: 1500, running: false },
          energy: 3, completed: false, tab: 'notes'
        };
        setTimeout(() => get().logActivity(`Created "${title}"`, cat === 'focus' ? 'focus' : cat === 'fire' ? 'fire' : 'admin'), 0);
        return { tasks: [...state.tasks, newTask] };
      }),

      updateTitle: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, title: trimmed } : t)
        }));
      },

      updateCategory: (id, cat) => {
        if (cat === 'pen') return;
        const task = get().tasks.find(t => t.id === id);
        if (!task || task.isPen) return;
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, cat } : t)
        }));
        get().logActivity(`Moved "${task.title}" → ${cat}`, cat === 'focus' ? 'focus' : cat === 'fire' ? 'fire' : 'admin');
      },

      archiveTask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          get().logActivity(`Archived "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
        }
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, completed: true, timer: t.timer ? { ...t.timer, running: false } : t.timer } : t)
        }));
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
          // Try 1×1
          if (used + 1 > TOTAL_CELLS) {
            get().addToast('Grid full — archive or resize a block first', '⚠');
            return;
          }
          restoredW = 1;
          restoredH = 1;
          get().addToast(`Restored "${task.title}" as 1×1 — grid is tight`, '↩');
        } else {
          get().addToast(`Restored "${task.title}"`, '↩');
        }

        get().logActivity(`Restored "${task.title}"`, task.cat === 'focus' ? 'focus' : task.cat === 'fire' ? 'fire' : 'admin');
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            completed: false,
            w: restoredW,
            h: restoredH,
            naturalW: restoredW,
            naturalH: restoredH,
          } : t)
        }));
      },

      changeTopology: (mode) => set((state) => {
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
        const nextTasks = JSON.parse(JSON.stringify(state.tasks));
        const result = applyTopology(nextTasks, 'deep', id, state.gridLayout);
        return { tasks: result.tasks, focusedTaskId: id };
      }),

      openShutter: (id) => set({ shutterOpen: id }),
      closeShutter: () => set({ shutterOpen: null }),

      setTileSize: (id, w, h) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, w, h, naturalW: w, naturalH: h } : t)
      })),

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
          }, 0);
          return {
            tasks: newTasks,
            focusSessions: [...finished, ...state.focusSessions],
          };
        }

        return { tasks: newTasks };
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

      addPenItem: (id, text) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? {
          ...t,
          items: [...(t.items || []), text]
        } : t)
      })),

      removePenItem: (id, index) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id && t.items) {
            const newItems = [...t.items];
            newItems.splice(index, 1);
            return { ...t, items: newItems };
          }
          return t;
        })
      })),

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

        get().removePenItem(penId, index);
        get().addTile(text, 'admin', 1, 1);
        get().addToast(`Promoted to grid: "${text}"`, '↗');
      },

      runDefrag: () => set((state) => {
        const completedCount = state.tasks.filter(t => t.completed).length;
        const unfinished = state.tasks.filter(t => !t.completed);
        const result = applyTopology(unfinished, 'normal', null, state.gridLayout);
        setTimeout(() => get().logActivity(`Defrag cleared ${completedCount} block${completedCount === 1 ? '' : 's'}`, 'system'), 0);
        return { tasks: result.tasks, mode: 'normal', focusedTaskId: null };
      }),

      reorderTasks: (sourceId, targetId) => set((state) => {
        if (sourceId === targetId) return state;
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
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
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
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        if (!p || !Array.isArray(p.tasks) || p.tasks.length === 0) {
          return current;
        }
        // Always stop running timers after reload
        const tasks = p.tasks.map(t =>
          t.timer?.running ? { ...t, timer: { ...t.timer, running: false } } : t
        );
        return {
          ...current,
          ...p,
          tasks,
          toasts: [],
          shutterOpen: null,
          isHoveringTask: false,
          focusSessions: Array.isArray(p.focusSessions) ? p.focusSessions : [],
          activityLogs: Array.isArray(p.activityLogs) ? p.activityLogs : current.activityLogs,
        };
      },
    }
  )
);

export function occupiedCells(tasks: Task[]): number {
  return tasks.reduce((sum, t) => {
    if (t.completed || t.isPen) return sum;
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
  const active = tasks.filter(t => !t.completed && !t.isPen);
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
