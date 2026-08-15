import React, { useEffect, useState, useRef } from 'react';
import { useStore, occupiedCells, type GridLayout, type PersistedWorkspace } from '../store';
import { GlowCard } from './GlowCard';
import {
  playClick,
  playComplete,
  playCreate,
  playArchive,
  playDefrag,
  playTagSpotlight,
  playThemeToggle,
  playError,
} from '../sounds';
import {
  Palette,
  Grid3X3,
  Volume2,
  VolumeX,
  Flame,
  Database,
  Bell,
  Download,
  Upload,
  Sun,
  Moon,
  Zap,
  Sliders,
  Trash2,
  Play,
  Info,
  X,
} from 'lucide-react';

type SettingsTab = 'appearance' | 'grid' | 'focus' | 'data';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    gridLayout,
    setGridLayout,
    resetWorkspace,
    soundsEnabled,
    toggleSounds,
    theme,
    toggleTheme,
    tasks,
    notificationPermission,
    requestNotificationPermission,
    hydrateCloudWorkspace,
    addToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [localLayout, setLocalLayout] = useState<GridLayout>(gridLayout);
  const [confirmReset, setConfirmReset] = useState(false);
  const [testedSound, setTestedSound] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TOTAL_CELLS = localLayout === '8x4' ? 32 : localLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);

  // Statistics
  const activeCount = tasks.filter(t => !t.archived && !t.isPen && !t.dormant).length;
  const penCount = tasks.find(t => t.isPen)?.items?.length || 0;
  const archiveCount = tasks.filter(t => t.archived).length;
  const recurringCount = tasks.filter(t => t.recurrence).length;

  useEffect(() => {
    if (isOpen) {
      setLocalLayout(gridLayout);
      setConfirmReset(false);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          handleSave();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, gridLayout]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (localLayout !== gridLayout) {
      setGridLayout(localLayout);
      addToast(`Workspace grid updated to ${localLayout}`, '📐');
    }
    if (soundsEnabled) playClick();
    onClose();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetWorkspace();
    setConfirmReset(false);
    if (soundsEnabled) playArchive();
    addToast('Workspace reset to defaults', '↺');
    onClose();
  };

  const testAudio = (name: string, fn: () => void) => {
    setTestedSound(name);
    fn();
    setTimeout(() => setTestedSound(null), 500);
  };

  const handleExportBackup = () => {
    try {
      const data: PersistedWorkspace = {
        mode: useStore.getState().mode,
        focusedTaskId: useStore.getState().focusedTaskId,
        tasks: useStore.getState().tasks,
        activityLogs: useStore.getState().activityLogs,
        focusSessions: useStore.getState().focusSessions,
        gridLayout: useStore.getState().gridLayout,
        morningIntentDate: useStore.getState().morningIntentDate,
        notificationPermission: useStore.getState().notificationPermission,
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `workstash-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (soundsEnabled) playCreate();
      addToast('Backup exported successfully', '💾');
    } catch {
      if (soundsEnabled) playError();
      addToast('Failed to export backup', '⚠');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && Array.isArray(parsed.tasks)) {
          hydrateCloudWorkspace(parsed);
          if (soundsEnabled) playDefrag();
          addToast(`Restored ${parsed.tasks.length} tasks from backup`, '✓');
          onClose();
        } else {
          throw new Error('Invalid schema');
        }
      } catch {
        if (soundsEnabled) playError();
        addToast('Invalid backup file format', '⚠');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'grid', label: 'Spatial Grid', icon: <Grid3X3 size={15} /> },
    { id: 'focus', label: 'Focus & Sound', icon: <Flame size={15} /> },
    { id: 'data', label: 'Data & Sync', icon: <Database size={15} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="purple"
        className="w-full max-w-[680px] bg-surface/98 backdrop-blur-2xl border border-line rounded-3xl p-6 sm:p-7 flex flex-col gap-6 shadow-2xl relative max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet/15 text-violet border border-violet/30 flex items-center justify-center shadow-brand">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold tracking-tight text-text leading-tight m-0">
                Workspace Preferences
              </h2>
              <p className="text-xs text-muted m-0 mt-0.5">
                Spatial constraints, aesthetics, audio synthesis, and cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tile-action !w-8 !h-8 !rounded-xl"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-elevated/80 border border-line/70 rounded-2xl shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id);
                if (soundsEnabled) playClick();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-elevated-hi text-text shadow-sm border border-line/80 font-bold'
                  : 'text-muted hover:text-text hover:bg-elevated'
              }`}
            >
              <span className={activeTab === t.id ? 'text-violet' : 'text-faint'}>{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 tile-scroll min-h-[300px]">
          {/* ─── TAB 1: APPEARANCE ─── */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-5">
              {/* Theme Mode */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-mono font-semibold tracking-widest text-muted uppercase">
                  Theme Palette
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'dark') {
                        toggleTheme();
                        if (soundsEnabled) playThemeToggle();
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      theme === 'dark'
                        ? 'bg-elevated-hi border-violet shadow-[0_0_20px_-4px_rgba(155,140,255,0.3)] ring-1 ring-violet/50'
                        : 'bg-elevated/60 border-line hover:border-faint'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet/20 text-violet border border-violet/30 flex items-center justify-center">
                          <Moon size={14} />
                        </div>
                        <span className="font-semibold text-sm text-text">Dark Obsidian</span>
                      </div>
                      {theme === 'dark' && (
                        <span className="w-5 h-5 rounded-full bg-violet text-void flex items-center justify-center text-[0.65rem] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="h-10 rounded-xl bg-[#070A10] border border-[#2A3348] p-2 flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-[#101622] border border-[#9B8CFF]/50" />
                      <div className="h-2 w-12 rounded bg-[#171F2E]" />
                      <div className="h-2 w-6 rounded bg-[#9B8CFF]/60 ml-auto" />
                    </div>
                    <p className="text-[0.72rem] text-muted m-0 leading-tight">
                      Deep slate black with glowing neon accents and chromatic glassmorphism.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'light') {
                        toggleTheme();
                        if (soundsEnabled) playThemeToggle();
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      theme === 'light'
                        ? 'bg-elevated-hi border-violet shadow-[0_0_20px_-4px_rgba(84,72,200,0.25)] ring-1 ring-violet/50'
                        : 'bg-elevated/60 border-line hover:border-faint'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber/20 text-amber border border-amber/30 flex items-center justify-center">
                          <Sun size={14} />
                        </div>
                        <span className="font-semibold text-sm text-text">Clean Porcelain</span>
                      </div>
                      {theme === 'light' && (
                        <span className="w-5 h-5 rounded-full bg-violet text-void flex items-center justify-center text-[0.65rem] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="h-10 rounded-xl bg-[#F1F3F9] border border-[#D1D5E8] p-2 flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-[#FFFFFF] border border-[#5448C8]/50 shadow-sm" />
                      <div className="h-2 w-12 rounded bg-[#E8EAF3]" />
                      <div className="h-2 w-6 rounded bg-[#5448C8]/60 ml-auto" />
                    </div>
                    <p className="text-[0.72rem] text-muted m-0 leading-tight">
                      Crisp white surfaces with rich contrast, cool blue-grey backing, and shadow depth.
                    </p>
                  </button>
                </div>
              </div>

              {/* Master Sound Switch */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-elevated/60 border border-line/80">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                    soundsEnabled ? 'bg-violet/15 text-violet border-violet/30' : 'bg-elevated text-faint border-line'
                  }`}>
                    {soundsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-text block">Haptic Audio Synthesis</span>
                    <span className="text-xs text-muted block mt-0.5">
                      Micro-synthesized Web Audio tones for UI delight (zero bandwidth, zero files)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleSounds();
                    if (!soundsEnabled) playClick();
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 border ${
                    soundsEnabled ? 'bg-violet border-violet/60' : 'bg-elevated-hi border-line'
                  }`}
                  aria-label={soundsEnabled ? 'Disable sounds' : 'Enable sounds'}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${
                      soundsEnabled ? 'left-[26px] bg-white' : 'left-0.5 bg-faint'
                    }`}
                  />
                </button>
              </div>

              {/* Live Soundboard Audition */}
              {soundsEnabled && (
                <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-elevated/40 border border-line/60">
                  <span className="text-xs font-mono font-semibold tracking-wide text-muted uppercase flex items-center gap-1.5">
                    <Zap size={13} className="text-violet" /> Sound Pack Audition
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { name: 'Complete', fn: playComplete, label: '✓ Complete' },
                      { name: 'Defrag', fn: playDefrag, label: '◈ Defrag' },
                      { name: 'Spotlight', fn: playTagSpotlight, label: '★ Spotlight' },
                      { name: 'Create', fn: playCreate, label: '+ Create' },
                      { name: 'Archive', fn: playArchive, label: '📦 Archive' },
                    ].map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => testAudio(s.name, s.fn)}
                        className={`py-2 px-2.5 rounded-xl border text-[0.72rem] font-mono font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          testedSound === s.name
                            ? 'bg-violet text-void border-violet scale-95'
                            : 'bg-elevated border-line text-muted hover:text-text hover:border-faint'
                        }`}
                      >
                        <Play size={10} fill="currentColor" />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2: SPATIAL GRID ─── */}
          {activeTab === 'grid' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-semibold tracking-widest text-muted uppercase">
                    Spatial Capacity Presets
                  </label>
                  <span className="text-xs font-mono text-faint">
                    Occupancy: <strong className="text-text">{used}</strong> / {TOTAL_CELLS} cells
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: '6x4' as GridLayout, name: 'Minimal Focus', cols: 6, rows: 4, total: 24, desc: 'Ultra-tight canvas. Best for strict deep work.' },
                    { id: '8x4' as GridLayout, name: 'Panoramic Wide', cols: 8, rows: 4, total: 32, desc: 'Expanded width. Ideal for multi-task workspaces.' },
                    { id: '6x5' as GridLayout, name: 'Tall Matrix', cols: 6, rows: 5, total: 30, desc: 'Balanced verticality. Great on high-res displays.' },
                  ].map((l) => {
                    const isSelected = localLayout === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setLocalLayout(l.id);
                          if (soundsEnabled) playClick();
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 relative ${
                          isSelected
                            ? 'bg-elevated-hi border-violet shadow-[0_0_20px_-4px_rgba(155,140,255,0.25)] ring-1 ring-violet/50'
                            : 'bg-elevated/60 border-line hover:border-faint'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold text-text">{l.id}</span>
                          <span className="text-xs font-mono text-violet font-semibold bg-violet-dim px-2 py-0.5 rounded-md border border-violet/30">
                            {l.total} cells
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-text">{l.name}</span>
                        <p className="text-[0.72rem] text-muted m-0 leading-snug">{l.desc}</p>
                        {/* Mini visual diagram */}
                        <div
                          className="w-full h-8 rounded-lg bg-void/60 border border-line/60 grid gap-0.5 p-1 mt-1 opacity-70"
                          style={{
                            gridTemplateColumns: `repeat(${l.cols}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${l.rows}, minmax(0, 1fr))`,
                          }}
                        >
                          {Array.from({ length: Math.min(12, l.total) }).map((_, i) => (
                            <div key={i} className="rounded-[1.5px] bg-faint/30" />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spatial rules info */}
              <div className="p-4 rounded-2xl bg-elevated/50 border border-line/70 flex items-start gap-3 text-xs text-muted leading-relaxed">
                <Info size={16} className="text-violet shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text block mb-0.5">Physical Workspace Boundary</strong>
                  WorkStash enforces rigid 2D grid limits to prevent cognitive overload. When the grid fills up, capture new thoughts in the bottom-right <strong>Inbox (Holding Pen)</strong> or run <strong>Defrag</strong> to consolidate completed blocks.
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: FOCUS & SENSORY ─── */}
          {activeTab === 'focus' && (
            <div className="flex flex-col gap-5">
              {/* Desktop Notifications */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-elevated/60 border border-line/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber/15 text-amber border border-amber/30 flex items-center justify-center">
                    <Bell size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-text block">Desktop Push Notifications</span>
                    <span className="text-xs text-muted block mt-0.5">
                      Receive alerts when your Pomodoro timer completes or focus breaks end
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    requestNotificationPermission();
                    if (soundsEnabled) playClick();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    notificationPermission === 'granted'
                      ? 'bg-teal-dim text-teal border-teal/40'
                      : 'bg-elevated text-muted border-line hover:text-text hover:border-faint'
                  }`}
                >
                  {notificationPermission === 'granted' ? '✓ Permission Granted' : 'Request Permission'}
                </button>
              </div>

              {/* Pomodoro Timer Presets */}
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-elevated/60 border border-line/80">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-amber" />
                  <span className="text-sm font-semibold text-text">The Ember Pomodoro Engine</span>
                </div>
                <p className="text-xs text-muted m-0">
                  Access the glowing Ember countdown widget at the <strong>bottom-left</strong> corner anytime. It attaches automatically to whichever tile timer you launch!
                </p>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="p-3 rounded-xl bg-void/50 border border-line text-center">
                    <span className="text-[0.68rem] font-mono uppercase text-muted block">Focus Phase</span>
                    <span className="text-base font-bold text-amber font-mono mt-0.5 block">25 min</span>
                  </div>
                  <div className="p-3 rounded-xl bg-void/50 border border-line text-center">
                    <span className="text-[0.68rem] font-mono uppercase text-muted block">Short Break</span>
                    <span className="text-base font-bold text-teal font-mono mt-0.5 block">5 min</span>
                  </div>
                  <div className="p-3 rounded-xl bg-void/50 border border-line text-center">
                    <span className="text-[0.68rem] font-mono uppercase text-muted block">Long Tide</span>
                    <span className="text-base font-bold text-violet font-mono mt-0.5 block">15 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 4: DATA & BACKUP ─── */}
          {activeTab === 'data' && (
            <div className="flex flex-col gap-5">
              {/* Live Workspace Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-elevated/60 border border-line flex flex-col">
                  <span className="text-[0.68rem] font-mono uppercase text-muted">Active Blocks</span>
                  <span className="text-xl font-bold font-mono text-text mt-1">{activeCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-elevated/60 border border-line flex flex-col">
                  <span className="text-[0.68rem] font-mono uppercase text-muted">Inbox Items</span>
                  <span className="text-xl font-bold font-mono text-teal mt-1">{penCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-elevated/60 border border-line flex flex-col">
                  <span className="text-[0.68rem] font-mono uppercase text-muted">Archived</span>
                  <span className="text-xl font-bold font-mono text-faint mt-1">{archiveCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-elevated/60 border border-line flex flex-col">
                  <span className="text-[0.68rem] font-mono uppercase text-muted">Rhythms</span>
                  <span className="text-xl font-bold font-mono text-amber mt-1">{recurringCount}</span>
                </div>
              </div>

              {/* JSON Backup & Restore */}
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-elevated/60 border border-line/80">
                <span className="text-xs font-mono font-semibold tracking-wide text-muted uppercase flex items-center gap-2">
                  <Database size={14} className="text-violet" /> Backup & Portability
                </span>
                <p className="text-xs text-muted m-0">
                  Export your entire workspace including spatial blocks, subtasks, scratchpads, and focus analytics into an offline JSON snapshot.
                </p>
                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-elevated-hi hover:bg-elevated border border-line hover:border-faint text-xs font-semibold text-text flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download size={14} className="text-violet" />
                    <span>Download Backup (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-elevated-hi hover:bg-elevated border border-line hover:border-faint text-xs font-semibold text-text flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload size={14} className="text-teal" />
                    <span>Restore from Backup</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </div>
              </div>

              {/* Danger Zone: Workspace Reset */}
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-danger/10 border border-danger/30">
                <div className="flex items-center gap-2 text-danger">
                  <Trash2 size={15} />
                  <span className="text-xs font-mono font-semibold tracking-wide uppercase">Danger Zone</span>
                </div>
                <p className="text-xs text-muted m-0">
                  Restores default starter tasks and clears all focus session analytics.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    confirmReset
                      ? 'bg-danger text-void border-danger shadow-md animate-pulse'
                      : 'bg-danger/15 hover:bg-danger/25 border-danger/40 text-danger'
                  }`}
                >
                  {confirmReset ? '⚠ Click again to confirm irreversible reset' : 'Reset Workspace to Factory Starter'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-line/80 shrink-0">
          <span className="text-[0.72rem] font-mono text-faint hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-text">Esc</kbd> to close, <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-line text-text">⌘ Enter</kbd> to save
          </span>
          <div className="flex gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-elevated text-muted hover:text-text border border-line hover:border-faint transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-text text-void hover:opacity-90 transition-transform active:scale-95 shadow-md cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};
