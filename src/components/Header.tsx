import React, { useState, useRef } from 'react';
import { Settings, Cloud } from 'lucide-react';
import { useStore, type TopologyMode, occupiedCells, getTotalCells } from '../store';
import { useAuth } from '../auth';
import { GlowCard } from './GlowCard';
import { Logo } from './Logo';
import { playClick, playThemeToggle, playDefrag } from '../sounds';

// ─── Spatial Bloom Action Menu ────────────────────────────────────────────────
interface BloomItem {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: number;
  onClick: () => void;
}

const WorkspaceBloom: React.FC<{ items: BloomItem[]; isUrgent?: boolean }> = ({ items, isUrgent }) => {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const enter = () => {
    clearTimeout(leaveTimer.current);
    setOpen(true);
  };
  const leave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 160);
  };

  const totalBadges = items.reduce((s, i) => s + (i.badge ?? 0), 0);

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      {/* Trigger — the single compact button */}
      <button
        type="button"
        className={`
          relative flex items-center gap-2 px-3 py-[7px] rounded-[10px]
          border font-semibold text-[0.8125rem] cursor-pointer
          transition-all duration-200 ease-out select-none
          ${ open
            ? 'bg-elevated-hi text-text border-faint rounded-b-none border-b-transparent z-[51] shadow-none'
            : isUrgent
            ? 'bg-teal-dim/40 text-teal border-teal/40 hover:bg-teal/20'
            : 'bg-elevated text-muted border-line hover:text-text hover:border-faint'
          }
        `}
      >
        {/* Animated 3×2 bento-grid icon */}
        <span
          className="relative flex flex-wrap gap-[3px] w-[13px] shrink-0 transition-all duration-300"
          style={{ transform: open ? 'rotate(45deg) scale(0.9)' : 'rotate(0deg) scale(1)' }}
          aria-hidden
        >
          {[0,1,2,3,4,5].map(i => (
            <span
              key={i}
              className="block rounded-[1.5px] transition-all duration-300"
              style={{
                width: i < 2 ? '5px' : i < 4 ? '5px' : '5px',
                height: '3.5px',
                background: open
                  ? `hsl(${250 + i * 20} 80% 70%)`
                  : 'currentColor',
                transitionDelay: `${i * 18}ms`,
                opacity: open ? 1 : 0.7,
              }}
            />
          ))}
        </span>
        <span>Workspace</span>
        {/* Live badge when actions pending */}
        {totalBadges > 0 && !open && (
          <span className="bg-teal text-void font-mono font-bold text-[0.6rem] px-1.5 py-px rounded-full leading-none shrink-0 animate-pulse">
            {totalBadges}
          </span>
        )}
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="transition-transform duration-200 opacity-50"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {/* Bloom panel */}
      {open && (
        <div
          className="absolute top-full left-0 z-50 min-w-[210px] animate-[bloomPanelIn_0.22s_cubic-bezier(0.2,0.9,0.3,1)_both]"
          style={{ filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.45))' }}
        >
          {/* Connector bar — bridges trigger bottom to panel top */}
          <div className="h-px bg-elevated-hi mx-[1px]" />

          <div
            className="
              bg-surface/95 backdrop-blur-xl border border-line
              rounded-b-[14px] rounded-tr-[14px]
              overflow-hidden shadow-2xl p-1 flex flex-col gap-0.5
            "
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { item.onClick(); setOpen(false); }}
                className="
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px]
                  text-left cursor-pointer
                  hover:bg-elevated-hi transition-all duration-150
                  group/item
                "
                style={{
                  animation: `bloomItemIn 0.28s cubic-bezier(0.22,1.2,0.36,1) both`,
                  animationDelay: `${i * 45}ms`,
                }}
              >
                {/* Accent dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover/item:scale-125"
                  style={{ background: item.accentColor }}
                />
                {/* Icon */}
                <span className="text-muted group-hover/item:text-text transition-colors duration-150 shrink-0">
                  {item.icon}
                </span>
                {/* Labels */}
                <span className="flex flex-col flex-1 min-w-0">
                  <span className="text-[0.8rem] font-semibold text-muted group-hover/item:text-text transition-colors duration-150 leading-none">
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span className="text-[0.68rem] text-faint mt-0.5 leading-none font-mono">
                      {item.sublabel}
                    </span>
                  )}
                </span>
                {/* Badge */}
                {(item.badge ?? 0) > 0 && (
                  <span
                    className="font-mono font-bold text-[0.6rem] px-2 py-0.5 rounded-full leading-none shrink-0 border"
                    style={{
                      background: `${item.accentColor}20`,
                      color: item.accentColor,
                      borderColor: `${item.accentColor}40`,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Arrow */}
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                  className="text-faint opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 -translate-x-1 group-hover/item:translate-x-0 transition-transform shrink-0"
                  aria-hidden
                >
                  <path d="M2 6h8M6 2l4 4-4 4" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<{ onNewTask: () => void; onDefrag: () => void; onOpenSettings: () => void; onOpenHelp: () => void; onOpenArchive: () => void; onOpenRhythm: () => void }> = ({ onNewTask, onDefrag, onOpenSettings, onOpenHelp, onOpenArchive, onOpenRhythm }) => {
  const { mode, changeTopology, tasks, addToast, gridLayout, selectedTagFilter, setSelectedTagFilter, theme, toggleTheme, soundsEnabled } = useStore();
  const { user, signOut, openLoginModal } = useAuth();

  const TOTAL_CELLS = getTotalCells(gridLayout);

  const used = occupiedCells(tasks);
  const capacityPct = Math.min(100, (used / TOTAL_CELLS) * 100);
  const capColor = capacityPct > 90 ? '#F0645A' : capacityPct > 70 ? '#F6B03A' : '#4FE3CE';

  const completedOnGridCount = tasks.filter(t => !t.archived && t.completed).length;

  const handleTopoClick = (m: TopologyMode) => {
    changeTopology(m);
    if (soundsEnabled) playClick();
    const label = {
      normal: 'All Blocks view restored',
      deep: 'Solo Focus — 1 block active, rest parked',
      fire: 'Urgent First — priority sorted',
      admin: 'Admin Sweep — clearing small tasks'
    }[m];
    addToast(label, '◈');
  };

  const modes: { id: TopologyMode; label: string; color: string }[] = [
    { id: 'normal', label: 'All Blocks', color: '#5B6782' },
    { id: 'deep', label: 'Solo Focus', color: '#9B8CFF' },
    { id: 'fire', label: 'Urgent First', color: '#F6B03A' },
    { id: 'admin', label: 'Admin Sweep', color: '#4FE3CE' },
  ];

  return (
    <GlowCard
      as="header"
      customSize
      glowColor="purple"
      className="w-full rounded-t-none rounded-b-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-4 p-[10px_12px] sm:p-[12px_16px] md:p-[14px_22px] shrink-0 bg-surface/90"
      style={{ border: 'none', borderBottom: '1px solid var(--color-line)', zIndex: 40 }}
    >
      {/* Primary Row: Brand, Top Controls & Action Buttons */}
      <div className="w-full flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Logo size={32} />
            <div className="shrink-0">
              <h1 className="font-display text-[1rem] sm:text-[1.05rem] font-semibold m-0 tracking-[-0.03em] leading-none text-text">
                WorkStash
              </h1>
              <p className="text-muted text-[0.65rem] sm:text-[0.72rem] m-0 mt-0.5 tracking-wide font-medium hidden sm:block">
                Spatial task workspace
              </p>
            </div>
          </div>

          {/* Desktop Topo Mode Switcher */}
          <div className="hidden md:flex gap-1 bg-void/50 p-1 rounded-xl border border-line shrink-0">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`border-none bg-transparent text-muted text-[0.8125rem] font-semibold py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 hover:text-text ${
                  mode === m.id ? 'bg-elevated-hi text-text shadow-[inset_0_0_0_1px_theme(colors.line)]' : ''
                }`}
                onClick={() => handleTopoClick(m.id)}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Capacity pill: hidden on tiny screen, shown as neat pill on sm+ */}
          <div className="hidden sm:flex relative items-center gap-2 mr-1 group/cap shrink-0">
            <span className="text-[0.75rem] text-muted font-mono font-medium tracking-wide tabular-nums cursor-default select-none">
              {used}/{TOTAL_CELLS}
            </span>
            <div className="w-[80px] md:w-[132px] h-1.5 rounded-full bg-elevated overflow-hidden border border-line/60">
              <div
                className="h-full rounded-full transition-[width,background] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                style={{ width: `${capacityPct}%`, background: capColor }}
              />
            </div>

          {/* Capacity tooltip */}
          <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[260px] opacity-0 group-hover/cap:opacity-100 transition-opacity duration-200 z-50 flex flex-col items-center">
            {/* Arrow pointing up */}
            <div className="w-2.5 h-2.5 rotate-45 bg-elevated-hi border-l border-t border-line -mb-[5px] z-10" />
            <div className="bg-elevated-hi border border-line rounded-2xl p-4 shadow-toast flex flex-col gap-3 w-full">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.6rem] font-semibold tracking-[0.08em] uppercase text-muted">Grid Capacity</span>
                <span className="font-mono text-[0.75rem] font-bold tabular-nums" style={{ color: capColor }}>{used}/{TOTAL_CELLS}</span>
              </div>

              {/* Bar */}
              <div className="h-1.5 rounded-full bg-elevated overflow-hidden border border-line/50">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${capacityPct}%`, background: capColor }}
                />
              </div>

              {/* Breakdown */}
              <div className="flex flex-col gap-1.5 text-[0.75rem]">
                <p className="text-muted m-0 leading-snug">
                  Each block occupies <span className="text-text font-semibold">w × h cells</span> on the grid. The total varies by layout:
                </p>
                <div className="grid grid-cols-4 gap-1.5 mt-0.5">
                  {(['6x4', '8x4', '6x5', '8x5'] as const).map(l => {
                    const total = getTotalCells(l);
                    const isCurrent = gridLayout === l;
                    return (
                      <div key={l} className={`text-center py-1.5 rounded-lg border text-[0.68rem] font-mono ${isCurrent ? 'bg-elevated border-faint text-text' : 'bg-void/40 border-line/50 text-faint'}`}>
                        <div className="font-semibold">{l}</div>
                        <div className="text-[0.6rem] opacity-70 mt-0.5">{total} cells</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted m-0 leading-snug mt-0.5">
                  <span className="text-text font-semibold">{TOTAL_CELLS - used}</span> {TOTAL_CELLS - used === 1 ? 'cell' : 'cells'} remaining. Completed or archived blocks don't count.
                </p>
              </div>
            </div>
          </div>
        </div>

        {selectedTagFilter && (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-dim border border-violet/40 text-violet font-mono text-[0.7rem] font-semibold hover:bg-violet/20 transition-colors cursor-pointer shadow-sm shrink-0"
            onClick={() => {
              setSelectedTagFilter(null);
              addToast('Cleared tag spotlight', '✓');
            }}
            title="Click to clear tag spotlight"
          >
            <span>#{selectedTagFilter}</span>
            <span className="text-[0.65rem] opacity-70">✕</span>
          </button>
        )}

        <WorkspaceBloom
          isUrgent={completedOnGridCount > 0}
          items={[
            {
              label: 'Rhythm',
              sublabel: 'Recurring task schedules',
              accentColor: 'var(--color-amber)',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12h4l3-9 4 18 3-9h4" />
                </svg>
              ),
              onClick: onOpenRhythm,
            },
            {
              label: 'Archive',
              sublabel: 'View completed and removed tasks',
              accentColor: 'var(--color-faint)',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="4" width="20" height="5" rx="2" />
                  <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                  <path d="M10 13h4" />
                </svg>
              ),
              onClick: onOpenArchive,
            },
            {
              label: 'Defrag',
              sublabel: completedOnGridCount > 0
                ? `${completedOnGridCount} block${completedOnGridCount > 1 ? 's' : ''} ready to clear`
                : 'Archive all completed blocks',
              accentColor: 'var(--color-teal)',
              badge: completedOnGridCount > 0 ? completedOnGridCount : undefined,
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              ),
              onClick: () => { onDefrag(); if (soundsEnabled) playDefrag(); },
            },
          ]}
        />
        <button
          type="button"
          className="border-none cursor-pointer font-semibold text-[0.8125rem] py-2 px-2.5 sm:px-3.5 rounded-[10px] transition-all duration-200 flex items-center gap-1 bg-text text-void hover:-translate-y-px hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.2)] shrink-0"
          onClick={onNewTask}
        >
          <span className="text-base font-bold leading-none">+</span>
          <span className="hidden sm:inline">New Task</span>
        </button>
        {/* Theme Toggle */}
        <button
          type="button"
          className="tile-action !w-8 !h-8 sm:!w-9 sm:!h-9 shrink-0"
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          onClick={() => {
            toggleTheme();
            if (soundsEnabled) playThemeToggle();
            addToast(theme === 'dark' ? 'Light mode activated' : 'Dark mode activated', theme === 'dark' ? '☀' : '◑');
          }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="tile-action !w-8 !h-8 sm:!w-9 sm:!h-9 shrink-0"
          title="Settings & Workspace Preferences"
          onClick={onOpenSettings}
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>
        <button
          type="button"
          className="tile-action !w-8 !h-8 sm:!w-9 sm:!h-9 font-semibold text-[0.85rem] shrink-0"
          title="Guide & Keyboard Shortcuts (?)"
          onClick={onOpenHelp}
          aria-label="Help"
        >
          ?
        </button>

        {user ? (
          <div className="flex items-center gap-2 pl-2.5 ml-1 border-l border-line shrink-0">
            <div className="w-7 h-7 rounded-full bg-violet/15 border border-violet/30 grid place-items-center text-violet text-[0.7rem] font-mono font-semibold uppercase shrink-0" title={user.displayName || user.email || undefined}>
              {(user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <button
              type="button"
              className="tile-action !w-7 !h-7 hover:!text-danger"
              title="Sign out"
              onClick={() => signOut()}
              aria-label="Sign out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-violet/10 hover:bg-violet/20 border border-violet/30 text-violet text-[0.72rem] sm:text-[0.75rem] font-semibold transition-all cursor-pointer shrink-0 shadow-sm"
            title="Enable continuous cloud sync across devices"
          >
            <Cloud size={13} />
            <span className="hidden sm:inline">Sign In / Sync</span>
            <span className="sm:hidden">Sync</span>
          </button>
        )}
      </div>
      </div>

      {/* Secondary Mobile Row: Mode Switcher */}
      <div className="flex md:hidden gap-1 bg-void/50 p-1 rounded-xl border border-line w-full overflow-x-auto no-scrollbar shrink-0">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`border-none bg-transparent text-muted text-[0.75rem] font-semibold py-1.5 px-2.5 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap hover:text-text shrink-0 ${
              mode === m.id ? 'bg-elevated-hi text-text shadow-[inset_0_0_0_1px_theme(colors.line)] font-bold' : ''
            }`}
            onClick={() => handleTopoClick(m.id)}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>
    </GlowCard>
  );
};
