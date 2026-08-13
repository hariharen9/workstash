import React, { useState, useEffect } from 'react';
import { useStore, type TaskCategory, occupiedCells } from '../store';
import { GlowCard } from './GlowCard';

const cats: { id: TaskCategory; label: string; desc: string; color: string; size: string }[] = [
  { id: 'focus', label: 'Deep Focus', desc: 'Complex work requiring concentration', color: 'violet', size: '3×2' },
  { id: 'fire', label: 'Urgent', desc: 'High priority, needs immediate attention', color: 'amber', size: '2×2' },
  { id: 'admin', label: 'Quick Admin', desc: 'Small tasks, emails, approvals', color: 'teal', size: '1×1' },
];

const fallbackSizes: Record<'focus' | 'fire' | 'admin', { w: number; h: number }[]> = {
  focus: [{ w: 3, h: 2 }, { w: 2, h: 2 }, { w: 2, h: 1 }, { w: 1, h: 1 }],
  fire: [{ w: 2, h: 2 }, { w: 2, h: 1 }, { w: 1, h: 1 }],
  admin: [{ w: 1, h: 1 }],
};

export const NewTaskModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTile, tasks, addToast, gridLayout } = useStore();
  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<TaskCategory>('focus');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
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
    const sizes = fallbackSizes[cat as 'focus' | 'fire' | 'admin'];
    const preferred = sizes[0];

    for (const size of sizes) {
      if (used + size.w * size.h <= TOTAL_CELLS) {
        addTile(title.trim(), cat, size.w, size.h);
        if (size !== preferred) {
          addToast(`Grid tight — created as ${size.w}×${size.h}. Drag the corner to resize.`, '⚡');
        }
        onClose();
        return;
      }
    }

    addToast('Grid is full — archive or resize a block first', '⚠');
  };

  return (
    <div
      className="fixed inset-0 bg-[#05070C]/70 backdrop-blur-md z-[50] flex items-center justify-center p-4"
      onClick={onClose}
      data-lenis-prevent="true"
    >
      <GlowCard
        customSize
        glowColor="blue"
        className="w-full max-w-[420px] bg-surface rounded-2xl p-6 animate-tileIn shadow-toast"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="m-0 mb-1 font-display text-[1.2rem] font-semibold tracking-[-0.03em]">New Task</h3>
        <p className="m-0 mb-5 text-[0.8125rem] text-muted">
          Drag the corner of any block to resize it on the grid.
        </p>

        <div className="mb-5">
          <label className="text-[0.72rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
            Title
          </label>
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
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

        <div className="mb-2">
          <label className="text-[0.72rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
            Category
          </label>
          <div className="flex flex-col gap-2">
            {cats.map(c => (
              <button
                key={c.id}
                type="button"
                className={`text-left py-2.5 px-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                  cat === c.id
                    ? 'border-faint text-text bg-elevated-hi'
                    : 'border-line bg-elevated text-muted hover:border-faint hover:text-text'
                }`}
                onClick={() => setCat(c.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    c.color === 'violet' ? 'bg-violet' :
                    c.color === 'amber' ? 'bg-amber' : 'bg-teal'
                  }`} />
                  <span className="text-[0.8125rem] font-semibold">{c.label}</span>
                  <span className="ml-auto font-mono text-[0.65rem] text-faint">{c.size}</span>
                </div>
                <p className="text-[0.72rem] opacity-55 mt-0.5 m-0 leading-snug">{c.desc}</p>
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

