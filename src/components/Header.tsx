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
  const capColor = capacityPct > 90 ? 'var(--danger)' : capacityPct > 70 ? 'var(--amber)' : 'var(--teal)';

  const handleTopoClick = (m: TopologyMode) => {
    changeTopology(m);
    const label = { normal: 'Normal grid restored', deep: 'Deep Work — one block, everything else parked', fire: 'Firefighter — dense, urgency-sorted', admin: 'Admin Sweep — clearing the small stuff' }[m];
    addToast(label, '◈');
  };

  return (
    <header>
      <div className="brand">
        <div className="brand-mark"><span></span></div>
        <h1>WorkStash<span className="tag">spatial task workspace</span></h1>
      </div>

      <div className="topo-switch">
        {(['normal', 'deep', 'fire', 'admin'] as TopologyMode[]).map((m) => (
          <button
            key={m}
            className={`topo-btn ${mode === m ? 'active' : ''}`}
            onClick={() => handleTopoClick(m)}
          >
            <span 
              className="topo-dot" 
              style={{ background: m === 'normal' ? 'var(--faint)' : m === 'deep' ? 'var(--violet)' : m === 'fire' ? 'var(--amber)' : 'var(--teal)' }}
            ></span>
            {m === 'normal' ? 'Normal' : m === 'deep' ? 'Deep Work' : m === 'fire' ? 'Firefighter' : 'Admin Sweep'}
          </button>
        ))}
      </div>

      <div className="header-actions">
        <div className="capacity-wrap">
          <span className="capacity-label">{occupiedCells}/{TOTAL_CELLS}</span>
          <div className="capacity-meter">
            <div className="capacity-fill" style={{ width: `${capacityPct}%`, background: capColor }}></div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onDefrag}>⟳ End-of-Day Defrag</button>
        <button className="btn btn-primary" onClick={onNewTask}>+ New Block</button>
      </div>
    </header>
  );
};
