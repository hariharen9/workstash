import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Battery,
  X,
  Plus,
  Zap,
  Repeat,
} from 'lucide-react';
import {
  useStore,
  type TaskCategory,
  occupiedCells,
  type Recurrence,
  type RecurrenceFrequency,
  DAY_NAMES,
  recurrenceLabel,
  defaultRecurrence,
} from '../store';
import { GlowCard } from './GlowCard';

interface CategoryOption {
  id: TaskCategory;
  label: string;
  short: string;
  desc: string;
  size: string;
  w: number;
  h: number;
  color: 'violet' | 'amber' | 'teal';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  defaultEnergy: number;
  defaultTimer: number; // in seconds
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'focus',
    label: 'Deep Focus',
    short: 'Focus',
    desc: 'Deep work requiring prolonged concentration & notes',
    size: '3×2 (6 cells)',
    w: 3,
    h: 2,
    color: 'violet',
    icon: Sparkles,
    defaultEnergy: 3,
    defaultTimer: 1500, // 25m
  },
  {
    id: 'fire',
    label: 'Urgent Priority',
    short: 'Urgent',
    desc: 'High-urgency blocker or fire requiring swift action',
    size: '2×2 (4 cells)',
    w: 2,
    h: 2,
    color: 'amber',
    icon: Flame,
    defaultEnergy: 4,
    defaultTimer: 900, // 15m
  },
  {
    id: 'admin',
    label: 'Quick Admin',
    short: 'Admin',
    desc: 'Fast approvals, micro-tasks & 1-tap checkoffs',
    size: '1×1 (1 cell)',
    w: 1,
    h: 1,
    color: 'teal',
    icon: CheckCircle2,
    defaultEnergy: 1,
    defaultTimer: 300, // 5m
  },
];

const fallbackSizes: Record<'focus' | 'fire' | 'admin', { w: number; h: number }[]> = {
  focus: [{ w: 3, h: 2 }, { w: 2, h: 2 }, { w: 2, h: 1 }, { w: 1, h: 1 }],
  fire: [{ w: 2, h: 2 }, { w: 2, h: 1 }, { w: 1, h: 1 }],
  admin: [{ w: 1, h: 1 }],
};

const FREQUENCIES: { id: RecurrenceFrequency; label: string; desc: string }[] = [
  { id: 'daily', label: 'Daily', desc: 'Every day' },
  { id: 'weekdays', label: 'Weekdays', desc: 'Mon - Fri' },
  { id: 'weekly', label: 'Weekly', desc: 'Specific days' },
  { id: 'monthly', label: 'Monthly', desc: 'Day of month' },
];

const TIMER_PRESETS = [
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '25m', seconds: 1500 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
];

export const NewTaskModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTile, addRecurringTile, tasks, addToast, gridLayout } = useStore();
  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;

  const [activeTab, setActiveTab] = useState<'standard' | 'recurring'>('standard');
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<TaskCategory>('focus');
  const [energy, setEnergy] = useState<number>(3);
  const [timerSeconds, setTimerSeconds] = useState<number>(1500);
  const [notes, setNotes] = useState<string>('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [kitTab, setKitTab] = useState<'subtasks' | 'notes' | 'timer' | 'energy'>('subtasks');

  // Recurring state
  const [recurrence, setRecurrence] = useState<Recurrence>(defaultRecurrence());

  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const usedCells = occupiedCells(tasks);
  const currentCategoryMeta = CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  const requiredCells = currentCategoryMeta.w * currentCategoryMeta.h;
  const willFitExact = usedCells + requiredCells <= TOTAL_CELLS;
  const willFitDownsized = !willFitExact && usedCells + 1 <= TOTAL_CELLS;
  const isCompletelyFull = usedCells >= TOTAL_CELLS;

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setCat('focus');
      setEnergy(3);
      setTimerSeconds(1500);
      setNotes('');
      setSubtasks([]);
      setNewSubtaskInput('');
      setActiveTab('standard');
      setKitTab('subtasks');
      setRecurrence(defaultRecurrence());
      setTimeout(() => titleInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, cat, energy, timerSeconds, notes, subtasks, recurrence, activeTab]);

  if (!isOpen) return null;

  const handleCategorySelect = (selectedCat: TaskCategory) => {
    setCat(selectedCat);
    const meta = CATEGORIES.find(c => c.id === selectedCat);
    if (meta) {
      setEnergy(meta.defaultEnergy);
      setTimerSeconds(meta.defaultTimer);
    }
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskInput.trim();
    if (trimmed) {
      setSubtasks(prev => [...prev, trimmed]);
      setNewSubtaskInput('');
      subtaskInputRef.current?.focus();
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const toggleWeekday = (d: number) => {
    setRecurrence(r => ({
      ...r,
      days: r.days.includes(d) ? r.days.filter(x => x !== d) : [...r.days, d].sort(),
    }));
  };

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      addToast('Please enter a task title', '⚠');
      titleInputRef.current?.focus();
      return;
    }

    if (activeTab === 'recurring') {
      addRecurringTile(trimmedTitle, cat, 1, 1, recurrence, {
        notes,
        subtasks,
        timerSeconds,
        energy,
      });
      addToast(`Recurring rhythm armed — ${recurrenceLabel(recurrence)}`, '⟳');
      onClose();
      return;
    }

    const sizes = fallbackSizes[cat as 'focus' | 'fire' | 'admin'];
    const preferred = sizes[0];

    for (const size of sizes) {
      if (usedCells + size.w * size.h <= TOTAL_CELLS) {
        addTile(trimmedTitle, cat, size.w, size.h, {
          notes,
          subtasks,
          timerSeconds,
          energy,
        });
        if (size !== preferred) {
          addToast(`Grid tight — placed as ${size.w}×${size.h}. Drag corner to resize.`, '⚡');
        } else {
          addToast(`Created "${trimmedTitle}" (${size.w}×${size.h})`, '✓');
        }
        onClose();
        return;
      }
    }

    addToast('Grid is full — defrag or resize existing blocks first', '⚠');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-void/80 backdrop-blur-xl animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor={currentCategoryMeta.color === 'violet' ? 'purple' : currentCategoryMeta.color === 'amber' ? 'orange' : 'green'}
        className="w-full max-w-[840px] max-h-[90vh] bg-surface/95 rounded-[24px] border border-line/80 shadow-2xl flex flex-col overflow-hidden relative"
        onClick={e => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line/70 shrink-0 bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-dim border border-violet/30 flex items-center justify-center text-violet shadow-brand shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="font-display font-semibold text-[1.15rem] leading-none m-0 text-text tracking-[-0.02em]">
                {activeTab === 'standard' ? 'Create Spatial Block' : 'Schedule Recurring Rhythm'}
              </h2>
              <p className="text-[0.72rem] text-muted m-0 mt-1 font-medium">
                {activeTab === 'standard' ? 'Physical task allocated on finite grid' : 'Off-grid routine scheduled to trigger automatically'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-1 bg-elevated p-1 rounded-xl border border-line/80 shrink-0">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] font-semibold transition-all cursor-pointer border-none ${
                activeTab === 'standard'
                  ? 'bg-elevated-hi text-text shadow-sm'
                  : 'bg-transparent text-muted hover:text-text'
              }`}
              onClick={() => setActiveTab('standard')}
            >
              <Zap size={13} />
              <span>Standard Block</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] font-semibold transition-all cursor-pointer border-none ${
                activeTab === 'recurring'
                  ? 'bg-elevated-hi text-text shadow-sm'
                  : 'bg-transparent text-muted hover:text-text'
              }`}
              onClick={() => setActiveTab('recurring')}
            >
              <Repeat size={13} />
              <span>Recurring Rhythm</span>
            </button>
          </div>

          <button
            type="button"
            className="tile-action !w-8 !h-8 text-muted hover:text-text !rounded-lg"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div
          className="flex-1 overflow-y-auto tile-scroll p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0"
          data-lenis-prevent="true"
        >
          {/* Left Column: Core Setup (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Title Section */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[0.7rem] font-semibold tracking-[0.06em] uppercase text-muted">
                  Task Title <span className="text-violet">*</span>
                </label>
                <span className="text-[0.68rem] font-mono text-faint">{title.length}/80</span>
              </div>
              <input
                ref={titleInputRef}
                type="text"
                maxLength={80}
                className="tile-field !text-[1rem] !py-3 !px-3.5 !rounded-xl !bg-elevated-hi/70 font-medium placeholder:text-muted/60"
                placeholder={activeTab === 'recurring' ? 'e.g., Weekly Team Retrospective' : 'e.g., Design token audit & color revamp'}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Category Selector Cards */}
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-semibold tracking-[0.06em] uppercase text-muted">
                Cognitive Weight & Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {CATEGORIES.map(c => {
                  const Icon = c.icon;
                  const isSelected = cat === c.id;
                  const colorBorder =
                    c.color === 'violet'
                      ? 'border-violet/40 bg-violet/10 ring-1 ring-violet/30'
                      : c.color === 'amber'
                      ? 'border-amber/40 bg-amber/10 ring-1 ring-amber/30'
                      : 'border-teal/40 bg-teal/10 ring-1 ring-teal/30';
                  const colorBadge =
                    c.color === 'violet'
                      ? 'bg-violet-dim text-violet'
                      : c.color === 'amber'
                      ? 'bg-amber-dim text-amber'
                      : 'bg-teal-dim text-teal';

                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2 relative ${
                        isSelected
                          ? `${colorBorder} shadow-lg`
                          : 'border-line bg-elevated/40 hover:bg-elevated hover:border-faint text-muted'
                      }`}
                      onClick={() => handleCategorySelect(c.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${colorBadge}`}>
                          <Icon size={13} />
                        </span>
                        <span className="font-mono text-[0.625rem] font-semibold tracking-wide text-faint">
                          {c.size.split(' ')[0]}
                        </span>
                      </div>
                      <div>
                        <div className={`text-[0.82rem] font-semibold leading-tight ${isSelected ? 'text-text' : 'text-muted'}`}>
                          {c.label}
                        </div>
                        <p className="text-[0.68rem] text-muted/70 leading-snug m-0 mt-1 line-clamp-2">
                          {c.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If in Recurring Mode: Schedule Configuration */}
            {activeTab === 'recurring' && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-elevated/40 border border-line/70">
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-violet" />
                  <span className="text-[0.75rem] font-semibold tracking-[0.04em] uppercase text-text">
                    Recurrence Schedule
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={`py-2 px-2.5 rounded-lg text-[0.75rem] font-semibold border transition-all cursor-pointer text-center ${
                        recurrence.frequency === f.id
                          ? 'bg-violet text-void border-violet/40 shadow-sm'
                          : 'bg-elevated border-line text-muted hover:text-text hover:border-faint'
                      }`}
                      onClick={() => setRecurrence(r => ({ ...r, frequency: f.id }))}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {recurrence.frequency === 'weekly' && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[0.68rem] text-muted font-medium">Select Days</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAY_NAMES.map((name, i) => (
                        <button
                          key={name}
                          type="button"
                          className={`w-9 h-9 rounded-lg text-[0.72rem] font-semibold border cursor-pointer transition-all ${
                            recurrence.days.includes(i)
                              ? 'bg-violet text-void border-violet/40'
                              : 'bg-elevated border-line text-muted hover:text-text hover:border-faint'
                          }`}
                          onClick={() => toggleWeekday(i)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <span className="text-[0.68rem] text-muted font-medium block mb-1">Time of Day</span>
                    <input
                      type="time"
                      className="tile-field !py-2 !text-[0.8rem]"
                      value={recurrence.time || '09:00'}
                      onChange={e => setRecurrence(r => ({ ...r, time: e.target.value || null }))}
                    />
                  </div>
                  {recurrence.frequency === 'monthly' ? (
                    <div>
                      <span className="text-[0.68rem] text-muted font-medium block mb-1">Day of Month</span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        className="tile-field !py-2 !text-[0.8rem]"
                        value={recurrence.monthDay ?? 1}
                        onChange={e => setRecurrence(r => ({ ...r, monthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="text-[0.68rem] text-muted font-medium block mb-1">Every N {recurrence.frequency === 'weekdays' ? 'weekdays' : recurrence.frequency === 'weekly' ? 'weeks' : 'days'}</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        className="tile-field !py-2 !text-[0.8rem]"
                        value={recurrence.interval}
                        onChange={e => setRecurrence(r => ({ ...r, interval: Math.min(30, Math.max(1, Number(e.target.value) || 1)) }))}
                      />
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-void/50 rounded-lg border border-line/60 text-[0.72rem] font-mono text-violet flex items-center gap-2">
                  <Calendar size={13} className="shrink-0" />
                  <span>{recurrenceLabel(recurrence)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Bento Preview & Initial Kit (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live Interactive Tile Preview */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-semibold tracking-[0.06em] uppercase text-muted">
                  Live Bento Preview
                </span>
                <span className="font-mono text-[0.65rem] text-violet bg-violet-dim px-2 py-0.5 rounded border border-violet/25">
                  {currentCategoryMeta.size.split(' ')[0]} Block
                </span>
              </div>

              {/* Bento Card Simulation */}
              <div
                className={`rounded-2xl border p-4 bg-surface shadow-tile flex flex-col gap-3 min-h-[160px] relative overflow-hidden transition-all duration-300 ${
                  currentCategoryMeta.color === 'violet'
                    ? 'border-violet/30 shadow-[inset_3px_0_0_#9B8CFF]'
                    : currentCategoryMeta.color === 'amber'
                    ? 'border-amber/30 shadow-[inset_3px_0_0_#F6B03A]'
                    : 'border-teal/30 shadow-[inset_3px_0_0_#4FE3CE]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-semibold text-[0.92rem] text-text m-0 break-words line-clamp-2">
                    {title.trim() || 'Untitled Task Block'}
                  </h4>
                  <span
                    className={`font-mono text-[0.625rem] font-semibold tracking-[0.04em] uppercase px-2 py-0.5 rounded-md shrink-0 ${
                      currentCategoryMeta.color === 'violet'
                        ? 'bg-violet-dim text-violet'
                        : currentCategoryMeta.color === 'amber'
                        ? 'bg-amber-dim text-amber'
                        : 'bg-teal-dim text-teal'
                    }`}
                  >
                    {currentCategoryMeta.short}
                  </span>
                </div>

                {/* Simulated Content based on size */}
                <div className="flex-1 flex flex-col justify-between gap-2 text-[0.75rem] text-muted">
                  {cat === 'admin' ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-8 h-8 rounded-xl border border-teal/40 bg-teal-dim flex items-center justify-center text-teal">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-[0.72rem] font-mono text-muted">Tap to Complete</span>
                    </div>
                  ) : subtasks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {subtasks.slice(0, 3).map((s, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 truncate text-[0.72rem]">
                          <span className="w-2.5 h-2.5 rounded-sm border border-faint shrink-0" />
                          <span className="truncate text-text/80">{s}</span>
                        </div>
                      ))}
                      {subtasks.length > 3 && (
                        <span className="text-[0.65rem] text-faint font-mono">+{subtasks.length - 3} more items</span>
                      )}
                    </div>
                  ) : notes.trim() ? (
                    <div className="font-mono text-[0.7rem] text-[#C8E8DC] line-clamp-2 bg-void/50 p-1.5 rounded">
                      {notes}
                    </div>
                  ) : (
                    <div className="text-[0.72rem] italic opacity-60">No initial kit added yet</div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-line/40 text-[0.68rem] font-mono text-faint">
                    <div className="flex items-center gap-1">
                      <Clock size={11} />
                      <span>{Math.floor(timerSeconds / 60)}m timer</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Battery size={11} />
                      <span>{energy}/5 energy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Kit Tabs (Subtasks, Notes, Timer, Energy) */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-elevated/40 border border-line/70">
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-semibold tracking-[0.06em] uppercase text-muted">
                  Initial Task Kit
                </span>
                <div className="flex gap-0.5 bg-void/60 p-0.5 rounded-lg border border-line/60">
                  <button
                    type="button"
                    className={`px-2 py-1 rounded text-[0.68rem] font-semibold cursor-pointer border-none ${
                      kitTab === 'subtasks' ? 'bg-elevated-hi text-text' : 'text-muted hover:text-text bg-transparent'
                    }`}
                    onClick={() => setKitTab('subtasks')}
                  >
                    Checklist ({subtasks.length})
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded text-[0.68rem] font-semibold cursor-pointer border-none ${
                      kitTab === 'notes' ? 'bg-elevated-hi text-text' : 'text-muted hover:text-text bg-transparent'
                    }`}
                    onClick={() => setKitTab('notes')}
                  >
                    Notes
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded text-[0.68rem] font-semibold cursor-pointer border-none ${
                      kitTab === 'timer' ? 'bg-elevated-hi text-text' : 'text-muted hover:text-text bg-transparent'
                    }`}
                    onClick={() => setKitTab('timer')}
                  >
                    Timer
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded text-[0.68rem] font-semibold cursor-pointer border-none ${
                      kitTab === 'energy' ? 'bg-elevated-hi text-text' : 'text-muted hover:text-text bg-transparent'
                    }`}
                    onClick={() => setKitTab('energy')}
                  >
                    Energy
                  </button>
                </div>
              </div>

              {/* Kit Tab: Subtasks */}
              {kitTab === 'subtasks' && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    <input
                      ref={subtaskInputRef}
                      type="text"
                      className="tile-field !py-1.5 !px-2.5 !text-[0.78rem] flex-1"
                      placeholder="Add subtask checklist item..."
                      value={newSubtaskInput}
                      onChange={e => setNewSubtaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="tile-chip !px-2.5 !py-1.5 text-text hover:border-violet flex items-center gap-1 shrink-0 cursor-pointer"
                      onClick={handleAddSubtask}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto tile-scroll pr-1">
                    {subtasks.length === 0 ? (
                      <span className="text-[0.72rem] text-muted italic py-1">No checklist items yet</span>
                    ) : (
                      subtasks.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-elevated/70 border border-line/50 text-[0.75rem] text-text"
                        >
                          <span className="truncate flex-1 min-w-0">{item}</span>
                          <button
                            type="button"
                            className="tile-action !w-5 !h-5 text-muted hover:text-danger"
                            onClick={() => handleRemoveSubtask(idx)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Kit Tab: Notes */}
              {kitTab === 'notes' && (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={4}
                    className="tile-field resize-none font-mono text-[0.78rem] leading-relaxed text-[#C8E8DC] p-2.5"
                    placeholder="Initial notes, code snippets, or error logs..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              )}

              {/* Kit Tab: Timer */}
              {kitTab === 'timer' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[0.75rem]">
                    <span className="text-muted">Pomodoro Session Target:</span>
                    <span className="font-mono text-text font-semibold">{Math.floor(timerSeconds / 60)} minutes</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TIMER_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        className={`py-1.5 rounded-lg font-mono text-[0.72rem] font-semibold border cursor-pointer transition-all ${
                          timerSeconds === preset.seconds
                            ? 'bg-violet text-void border-violet/40'
                            : 'bg-elevated border-line text-muted hover:text-text'
                        }`}
                        onClick={() => setTimerSeconds(preset.seconds)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kit Tab: Energy */}
              {kitTab === 'energy' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[0.75rem]">
                    <span className="text-muted">Cognitive Energy Cost:</span>
                    <span className="font-mono text-text font-semibold">{energy} / 5 units (~{(energy * 0.5).toFixed(1)}h)</span>
                  </div>
                  <div className="flex gap-1.5 items-end h-8">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        type="button"
                        className={`flex-1 rounded-t-md border-none cursor-pointer transition-all duration-200 ${
                          i <= energy ? 'bg-violet shadow-brand' : 'bg-elevated hover:bg-elevated-hi'
                        }`}
                        style={{ height: `${8 + i * 4.5}px` }}
                        onClick={() => setEnergy(i)}
                        aria-label={`Set energy to ${i}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-line/70 shrink-0 bg-surface/80 backdrop-blur-sm">
          {/* Capacity Telemetry & Shortcuts */}
          <div className="flex items-center gap-3 text-[0.75rem]">
            {activeTab === 'standard' ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.72rem] text-faint">
                  Grid Capacity: <span className={willFitExact ? 'text-teal font-semibold' : 'text-amber font-semibold'}>{usedCells}/{TOTAL_CELLS}</span>
                </span>
                {!willFitExact && willFitDownsized && (
                  <span className="text-amber text-[0.7rem] bg-amber-dim border border-amber/20 px-2 py-0.5 rounded-md">
                    Will downsize to fit
                  </span>
                )}
                {isCompletelyFull && (
                  <span className="text-danger text-[0.7rem] bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-md">
                    Grid full
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted text-[0.72rem] font-mono">
                Off-grid · Will not consume capacity cells
              </span>
            )}
            <span className="hidden sm:inline-block text-faint font-mono text-[0.68rem]">
              (Ctrl+↵ to create)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="cursor-pointer font-semibold text-[0.8125rem] py-2 px-4 rounded-xl transition-all duration-150 bg-elevated text-muted border border-line hover:text-text hover:border-faint"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="border-none cursor-pointer font-semibold text-[0.8125rem] py-2 px-5 rounded-xl transition-all duration-200 bg-text text-void hover:-translate-y-px hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.25)] flex items-center gap-2"
              onClick={handleCreate}
            >
              <Plus size={15} />
              <span>{activeTab === 'recurring' ? 'Arm Recurring Rhythm' : 'Create Task Block'}</span>
            </button>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};
