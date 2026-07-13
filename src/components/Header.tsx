import React from 'react';
import { useStore, type TopologyMode } from '../store';

const TOTAL_CELLS = 24;

export const Header: React.FC<{ onNewTask: () => void; onDefrag: () => void }> = ({ onNewTask, onDefrag }) => {
  const { mode, changeTopology, tasks, addToast } = useStore();
  
  const occupiedCells = tasks.reduce((sum, t) => {
    if (t.completed) return sum;
    return sum + (t.parked ? 1 : t.w * t.h);
  }, 0);

  const capacityPct = Math.min(100, (occupiedCells / TOTAL_CELLS) * 100);
  const capColor = capacityPct > 90 ? '#F0645A' : capacityPct > 70 ? '#F5A623' : '#5EEAD4';

  const handleTopoClick = (m: TopologyMode) => {
    changeTopology(m);
    const label = { normal: 'Normal grid restored', deep: 'Deep Work — one block, everything else parked', fire: 'Firefighter — dense, urgency-sorted', admin: 'Admin Sweep — clearing the small stuff' }[m];
    addToast(label, '◈');
  };

  return (
    <header className="flex items-center justify-between p-[16px_22px] border-b border-line shrink-0 bg-gradient-to-b from-surface to-void">
      <div className="flex items-center gap-2.5">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-[conic-gradient(from_220deg,theme(colors.violet),theme(colors.teal),theme(colors.amber),theme(colors.violet))] grid place-items-center shadow-brand">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-void"></span>
        </div>
        <h1 className="text-base font-semibold m-0 tracking-[-0.02em]">
          WorkStash
          <span className="text-muted text-[11px] ml-2 font-normal">spatial task workspace</span>
        </h1>
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-[11px] border border-line">
        {(['normal', 'deep', 'fire', 'admin'] as TopologyMode[]).map((m) => (
          <button
            key={m}
            className={`border-none bg-transparent text-muted text-[11.5px] font-medium py-[7px] px-3 rounded-lg cursor-pointer transition-all duration-250 font-sans flex items-center gap-1.5 hover:text-text ${
              mode === m ? 'bg-elevated-hi text-text shadow-[inset_0_0_0_1px_theme(colors.line)]' : ''
            }`}
            onClick={() => handleTopoClick(m)}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ background: m === 'normal' ? '#4A5570' : m === 'deep' ? '#8B7CF6' : m === 'fire' ? '#F5A623' : '#5EEAD4' }}
            ></span>
            {m === 'normal' ? 'Normal' : m === 'deep' ? 'Deep Work' : m === 'fire' ? 'Firefighter' : 'Admin Sweep'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-muted font-mono tracking-[0.03em]">{occupiedCells}/{TOTAL_CELLS}</span>
          <div className="w-[150px] h-1.5 rounded-[4px] bg-elevated overflow-hidden relative">
            <div className="h-full rounded-[4px] transition-[width,background] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ width: `${capacityPct}%`, background: capColor }}></div>
          </div>
        </div>
        <button className="border-none cursor-pointer font-sans font-medium text-[12.5px] py-[9px] px-[14px] rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-surface text-muted border border-line hover:text-text hover:border-faint" onClick={onDefrag}>
          ⟳ End-of-Day Defrag
        </button>
        <button className="border-none cursor-pointer font-sans font-medium text-[12.5px] py-[9px] px-[14px] rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-text text-void hover:-translate-y-px hover:shadow-[0_6px_16px_-4px_rgba(255,255,255,0.15)]" onClick={onNewTask}>
          + New Block
        </button>
      </div>
    </header>
  );
};
