import React from 'react';
import { useStore, type TopologyMode, occupiedCells } from '../store';
import { GlowCard } from './GlowCard';

export const Header: React.FC<{ onNewTask: () => void; onDefrag: () => void; onOpenSettings: () => void; onOpenHelp: () => void }> = ({ onNewTask, onDefrag, onOpenSettings, onOpenHelp }) => {
  const { mode, changeTopology, tasks, addToast, gridLayout } = useStore();

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;

  const used = occupiedCells(tasks);
  const capacityPct = Math.min(100, (used / TOTAL_CELLS) * 100);
  const capColor = capacityPct > 90 ? '#F0645A' : capacityPct > 70 ? '#F6B03A' : '#4FE3CE';

  const handleTopoClick = (m: TopologyMode) => {
    changeTopology(m);
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
      className="w-full rounded-t-none rounded-b-2xl flex items-center justify-between gap-4 p-[14px_22px] shrink-0 bg-surface/90"
      style={{ border: 'none', borderBottom: '1px solid var(--color-line)', zIndex: 40 }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-[8px] bg-[conic-gradient(from_220deg,theme(colors.violet),theme(colors.teal),theme(colors.amber),theme(colors.violet))] grid place-items-center shadow-brand shrink-0">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-void"></span>
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[1.05rem] font-semibold m-0 tracking-[-0.03em] leading-none">
            WorkStash
          </h1>
          <p className="text-muted text-[0.72rem] m-0 mt-1 tracking-wide font-medium">Spatial task workspace</p>
        </div>
      </div>

      <div className="flex gap-1 bg-void/50 p-1 rounded-xl border border-line shrink-0">
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

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 mr-1">
          <span className="text-[0.75rem] text-muted font-mono font-medium tracking-wide tabular-nums">
            {used}/{TOTAL_CELLS}
          </span>
          <div className="w-[132px] h-1.5 rounded-full bg-elevated overflow-hidden border border-line/60">
            <div
              className="h-full rounded-full transition-[width,background] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ width: `${capacityPct}%`, background: capColor }}
            />
          </div>
        </div>
        <button
          type="button"
          className="cursor-pointer font-semibold text-[0.8125rem] py-2 px-3.5 rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-elevated text-muted border border-line hover:text-text hover:border-faint"
          onClick={onDefrag}
        >
          Defrag
        </button>
        <button
          type="button"
          className="border-none cursor-pointer font-semibold text-[0.8125rem] py-2 px-3.5 rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-text text-void hover:-translate-y-px hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.2)]"
          onClick={onNewTask}
        >
          + New Task
        </button>
        <button
          type="button"
          className="tile-action !w-9 !h-9 !text-[0.95rem] !font-semibold"
          title="About WorkStash"
          onClick={onOpenHelp}
          aria-label="Help"
        >
          ?
        </button>
        <button
          type="button"
          className="tile-action !w-9 !h-9"
          title="Settings"
          onClick={onOpenSettings}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
        </button>
      </div>
    </GlowCard>
  );
};
