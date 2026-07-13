import { create } from 'zustand';

export type TaskCategory = 'focus' | 'fire' | 'admin' | 'pen';
export type TopologyMode = 'normal' | 'deep' | 'fire' | 'admin';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
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
  _deepPicked?: boolean;
}

export interface Toast {
  id: string;
  msg: string;
  icon: string;
}

interface AppState {
  mode: TopologyMode;
  focusedTaskId: string | null;
  tasks: Task[];
  shutterOpen: string | null;
  toasts: Toast[];

  addTile: (title: string, cat: TaskCategory, w: number, h: number) => void;
  archiveTask: (id: string) => void;
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
  setEnergy: (id: string, val: number) => void;
  addPenItem: (id: string, text: string) => void;
  removePenItem: (id: string, index: number) => void;
  runDefrag: () => void;
  setFocusedTask: (id: string) => void;
  addToast: (msg: string, icon?: string) => void;
  removeToast: (id: string) => void;
  isHoveringTask: boolean;
  setIsHoveringTask: (val: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const GRID_COLS = 6;
const GRID_ROWS = 4;

function applyTopology(tasks: Task[], mode: TopologyMode, focusedTaskId: string | null) {
  let newFocusedId = focusedTaskId;
  
  tasks.forEach(t => {
    t.parked = false;
    if (t.isPen) return;
    if (mode === 'normal') {
      t.w = t.naturalW; t.h = t.naturalH;
    } else if (mode === 'deep') {
      const isFocus = t.id === newFocusedId || (!newFocusedId && t.cat === 'focus' && !t._deepPicked);
      if (t.id === newFocusedId) {
        t.w = Math.min(4, GRID_COLS); t.h = Math.min(3, GRID_ROWS);
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
      // Re-run applyTopology with new focused ID
      return applyTopology(tasks, mode, newFocusedId);
    }
  }

  if (mode === 'fire') {
    const order: Record<string, number> = { fire: 0, focus: 1, admin: 2, pen: 3 };
    tasks.sort((a, b) => (order[a.cat] ?? 9) - (order[b.cat] ?? 9));
  }

  return { tasks, newFocusedId };
}

const initialTasks: Task[] = [
  { id: uid(), title: 'Design token audit for WorkStash', cat: 'focus', w: 3, h: 2, naturalW: 3, naturalH: 2, type: 'deep',
    notes: '// TODO: reconcile --elevated vs --elevated-hi\n// check contrast on amber badges', subtasks: [
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

const { tasks: initializedTasks, newFocusedId: initialFocusId } = applyTopology(initialTasks, 'normal', null);

export const useStore = create<AppState>((set, get) => ({
  mode: 'normal',
  focusedTaskId: initialFocusId,
  tasks: initializedTasks,
  shutterOpen: null,
  toasts: [],
  isHoveringTask: false,
  setIsHoveringTask: (val) => set({ isHoveringTask: val }),

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
    return { tasks: [...state.tasks, newTask] };
  }),

  archiveTask: (id) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, completed: true } : t)
  })),

  changeTopology: (mode) => set((state) => {
    const nextTasks = JSON.parse(JSON.stringify(state.tasks));
    let nextFocusId = mode !== 'deep' ? null : state.focusedTaskId;
    const result = applyTopology(nextTasks, mode, nextFocusId);
    return { mode, tasks: result.tasks, focusedTaskId: result.newFocusedId };
  }),

  setFocusedTask: (id) => set((state) => {
    if (state.mode !== 'deep') return {};
    const nextTasks = JSON.parse(JSON.stringify(state.tasks));
    const result = applyTopology(nextTasks, 'deep', id);
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

  setTimerRunning: (id, running) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? {
      ...t,
      timer: t.timer ? { ...t.timer, running } : t.timer
    } : t)
  })),

  tickTimer: (id) => set((state) => {
    let timerFinished = false;
    let finishedTitle = '';
    const newState = {
      tasks: state.tasks.map(t => {
        if (t.id === id && t.timer && t.timer.running && t.timer.remaining > 0) {
          const nextRemaining = t.timer.remaining - 1;
          if (nextRemaining === 0) {
            timerFinished = true;
            finishedTitle = t.title;
          }
          return {
            ...t,
            timer: { ...t.timer, remaining: nextRemaining, running: nextRemaining > 0 }
          };
        }
        return t;
      })
    };
    
    if (timerFinished) {
      // Trigger side effect for toast
      setTimeout(() => get().addToast(`Timer done — "${finishedTitle}"`, '⏰'), 0);
    }
    
    return newState;
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
        const newTotal = Math.max(300, t.timer.total + deltaSeconds);
        return { ...t, timer: { ...t.timer, total: newTotal, remaining: newTotal } };
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

  runDefrag: () => set((state) => {
    const unfinished = state.tasks.filter(t => !t.completed);
    const result = applyTopology(unfinished, 'normal', null);
    return { tasks: result.tasks, mode: 'normal', focusedTaskId: null };
  })
}));
