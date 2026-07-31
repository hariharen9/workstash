import React, { useState, useEffect } from 'react';
import { useStore, type TaskCategory, occupiedCells } from '../store';
import { GlowCard } from './GlowCard';

const sizes = [
  { w: 1, h: 1, label: '1×1', hint: 'Micro' },
  { w: 2, h: 1, label: '2×1', hint: 'List' },
  { w: 2, h: 2, label: '2×2', hint: 'Focus' },
  { w: 3, h: 2, label: '3×2', hint: 'Deep' },
] as const;

const cats: { id: TaskCategory; label: string }[] = [
  { id: 'focus', label: 'Deep Focus' },
  { id: 'fire', label: 'Urgent' },
  { id: 'admin', label: 'Quick Admin' },
];

export const NewTaskModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTile, tasks, addToast, gridLayout } = useStore();
  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const [title, setTitle] = useState('');
  const [size, setSize] = useState({ w: 2, h: 2 });
  const [cat, setCat] = useState<TaskCategory>('focus');

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

    const used = occupiedCells(tasks);
    const need = size.w * size.h;

    if (used + need > TOTAL_CELLS) {
      addToast('Not enough grid space for that size', '⚠');
      return;
    }

    addTile(title.trim(), cat, size.w, size.h);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#05070C]/70 backdrop-blur-md z-[50] flex items-center justify-center p-4" onClick={onClose} data-lenis-prevent="true">
      <GlowCard customSize glowColor="blue" className="w-full max-w-[440px] bg-surface rounded-2xl p-6 animate-tileIn shadow-toast" onClick={e => e.stopPropagation()}>
        <h3 className="m-0 mb-1 font-display text-[1.2rem] font-semibold tracking-[-0.03em]">New Task</h3>
        <p className="m-0 mb-5 text-[0.8125rem] text-muted">Size is cognitive weight — keep the grid honest.</p>

        <div className="mb-4">
          <label className="text-[0.72rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">Title</label>
          <input
            className="tile-field !text-[0.9375rem] !py-3"
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

        <div className="mb-4">
          <label className="text-[0.72rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">Cognitive weight</label>
          <div className="grid grid-cols-4 gap-2">
            {sizes.map(s => (
              <button
                key={s.label}
                type="button"
                className={`text-center py-3 px-1 rounded-xl border cursor-pointer transition-all duration-150 ${
                  size.w === s.w && size.h === s.h
                    ? 'border-faint text-text bg-elevated-hi'
                    : 'border-line bg-elevated text-muted hover:border-faint hover:text-text'
                }`}
                onClick={() => setSize({ w: s.w, h: s.h })}
              >
                <div className="font-display font-semibold text-[0.9375rem] tracking-tight">{s.label}</div>
                <div className="text-[0.7rem] mt-1 opacity-70 font-medium">{s.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <label className="text-[0.72rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {cats.map(c => (
              <button
                key={c.id}
                type="button"
                className={`text-center py-2.5 px-2 rounded-xl border cursor-pointer text-[0.8125rem] font-semibold transition-all duration-150 ${
                  cat === c.id
                    ? 'border-faint text-text bg-elevated-hi'
                    : 'border-line bg-elevated text-muted hover:border-faint hover:text-text'
                }`}
                onClick={() => setCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="cursor-pointer font-semibold text-[0.8125rem] py-2.5 px-4 rounded-[10px] transition-all duration-200 bg-elevated text-muted border border-line hover:text-text hover:border-faint"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="border-none cursor-pointer font-semibold text-[0.8125rem] py-2.5 px-4 rounded-[10px] transition-all duration-200 bg-text text-void hover:-translate-y-px hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.2)]"
            onClick={handleCreate}
          >
            Create Task
          </button>
        </div>
      </GlowCard>
    </div>
  );
};
