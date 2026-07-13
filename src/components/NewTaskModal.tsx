import React, { useState, useEffect } from 'react';
import { useStore, type TaskCategory } from '../store';

export const NewTaskModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTile, tasks, addToast, gridLayout } = useStore();
  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const [title, setTitle] = useState('');
  const [size, setSize] = useState({ w: 2, h: 2 });
  const [cat, setCat] = useState<TaskCategory>('focus');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSize({ w: 2, h: 2 });
      setCat('focus');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) {
      addToast('Give it a title first', '⚠');
      return;
    }

    const occupiedCells = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.parked ? 1 : t.w * t.h), 0);
    const need = size.w * size.h;

    if (occupiedCells + need > TOTAL_CELLS) {
      addToast('Not enough grid space for that size', '⚠');
      return;
    }

    addTile(title.trim(), cat, size.w, size.h);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#05070C]/60 backdrop-blur-[6px] z-[50] flex items-center justify-center" onClick={onClose}>
      <div className="w-[420px] bg-surface border border-line rounded-[18px] p-[22px] animate-tileIn" onClick={e => e.stopPropagation()}>
        <h3 className="m-0 mb-4 font-display text-[15px]">New Task</h3>
        <div className="mb-3.5">
          <label className="text-[11px] text-muted block mb-1.5 font-mono tracking-[0.02em]">Title</label>
          <input
            className="w-full bg-elevated border border-line text-text p-[10px_11px] rounded-[9px] text-[13px] outline-none font-sans focus:border-faint"
            type="text"
            placeholder="e.g. Refactor auth middleware"
            maxLength={80}
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
        </div>
        <div className="mb-3.5">
          <label className="text-[11px] text-muted block mb-1.5 font-mono tracking-[0.02em]">Cognitive weight (size)</label>
          <div className="flex gap-2">
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${size.w === 1 && size.h === 1 ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setSize({ w: 1, h: 1 })}>
              1×1<br /><span className="opacity-60">micro</span>
            </div>
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${size.w === 2 && size.h === 1 ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setSize({ w: 2, h: 1 })}>
              2×1<br /><span className="opacity-60">standard</span>
            </div>
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${size.w === 2 && size.h === 2 ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setSize({ w: 2, h: 2 })}>
              2×2<br /><span className="opacity-60">focus</span>
            </div>
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${size.w === 3 && size.h === 2 ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setSize({ w: 3, h: 2 })}>
              3×2<br /><span className="opacity-60">deep</span>
            </div>
          </div>
        </div>
        <div className="mb-3.5">
          <label className="text-[11px] text-muted block mb-1.5 font-mono tracking-[0.02em]">Category</label>
          <div className="flex gap-2">
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${cat === 'focus' ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setCat('focus')}>Deep Work</div>
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${cat === 'fire' ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setCat('fire')}>Firefighter</div>
            <div className={`flex-1 text-center py-[9px] px-1.5 rounded-[9px] border border-line bg-elevated cursor-pointer text-[11.5px] text-muted transition-all duration-150 ${cat === 'admin' ? 'border-faint text-text bg-elevated-hi' : ''}`} onClick={() => setCat('admin')}>Admin</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-[18px]">
          <button className="border-none cursor-pointer font-sans font-medium text-[12.5px] py-[9px] px-[14px] rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-surface text-muted border border-line hover:text-text hover:border-faint" onClick={onClose}>Cancel</button>
          <button className="border-none cursor-pointer font-sans font-medium text-[12.5px] py-[9px] px-[14px] rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-text text-void hover:-translate-y-px hover:shadow-[0_6px_16px_-4px_rgba(255,255,255,0.15)]" onClick={handleCreate}>Create Task</button>
        </div>
      </div>
    </div>
  );
};
