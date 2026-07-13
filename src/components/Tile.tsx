import React, { useState, useEffect } from 'react';
import { useStore, type Task } from '../store';
import { TileContent } from './TileContent';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DragIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <circle cx="4" cy="2" r="1.2" />
    <circle cx="8" cy="2" r="1.2" />
    <circle cx="4" cy="6" r="1.2" />
    <circle cx="8" cy="6" r="1.2" />
    <circle cx="4" cy="10" r="1.2" />
    <circle cx="8" cy="10" r="1.2" />
  </svg>
);

export const Tile: React.FC<{ task: Task }> = ({ task }) => {
  const { archiveTask, openShutter, setTileSize, tasks, mode, setFocusedTask, addToast, setIsHoveringTask, gridLayout } = useStore();
  
  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;

  const [isCompleting, setIsCompleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  useEffect(() => {
    // Remove the entering class after the animation finishes
    const t = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isHovered && !task.isPen) {
      setIsHoveringTask(true);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'f') {
          const active = document.activeElement;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
          openShutter(task.id);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        setIsHoveringTask(false);
      };
    }
  }, [isHovered, task.id, openShutter, task.isPen, setIsHoveringTask]);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    setTimeout(() => {
      archiveTask(task.id);
      addToast(`Archived "${task.title}"`, '✓');
    }, 480);
  };

  const handleResize = (e: React.MouseEvent, w: number, h: number) => {
    e.stopPropagation();
    const currentUsed = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.parked ? 1 : t.w * t.h), 0);
    const delta = (w * h) - (task.w * task.h);
    if (currentUsed + delta <= TOTAL_CELLS) {
      setTileSize(task.id, w, h);
    } else {
      addToast('Not enough room — free up space first', '⚠');
    }
  };

  const handleDoubleClick = () => {
    if (mode === 'deep') {
      setFocusedTask(task.id);
    }
  };

  const sizeOptions = [
    { w: 1, h: 1, label: '1×1' },
    { w: 2, h: 1, label: '2×1' },
    { w: 2, h: 2, label: '2×2' },
    { w: 3, h: 2, label: '3×2' }
  ];

  const catClass = task.isPen
    ? 'shadow-pen-cat'
    : task.cat === 'focus'
    ? 'shadow-focus-cat'
    : task.cat === 'fire'
    ? 'shadow-fire-cat'
    : task.cat === 'admin'
    ? 'shadow-admin-cat'
    : '';

  const penBg = task.isPen
    ? { background: 'repeating-linear-gradient(135deg, #121826, #121826 10px, rgba(255,255,255,0.01) 10px, rgba(255,255,255,0.01) 20px)' }
    : {};

  const style = {
    gridColumn: `span ${task.w}`,
    gridRow: `span ${task.h}`,
    ...penBg,
    transform: CSS.Transform.toString(transform),
    transition: transition || 'opacity 0.45s cubic-bezier(0.3, 0.9, 0.3, 1), transform 0.45s cubic-bezier(0.3, 0.9, 0.3, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-radius bg-surface border border-line p-[14px_16px] overflow-hidden flex flex-col transition-[background,border,box-shadow,opacity] duration-300 min-h-0 hover:border-faint ${catClass} ${
        task.parked ? 'opacity-[0.32] saturate-[0.4]' : ''
      } ${isCompleting ? 'animate-completePop' : ''} ${isEntering ? 'animate-tileIn' : ''} ${isDragging ? 'opacity-50 ring-2 ring-violet shadow-xl scale-[1.02]' : ''}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {task.isPen ? (
        <>
          <div {...attributes} {...listeners} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center cursor-grab text-muted hover:text-text z-10" title="Drag to reorder"><DragIcon /></div>
          <TileContent task={task} />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="font-display font-semibold text-[13.5px] leading-1.3 tracking-[-0.01em] m-0 break-words">{task.title}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <div {...attributes} {...listeners} className="w-5 h-5 rounded-[6px] grid place-items-center cursor-grab text-muted hover:bg-elevated hover:text-text transition-colors" title="Drag to reorder"><DragIcon /></div>
              <button className="w-5 h-5 rounded-[6px] border-none bg-transparent text-muted cursor-pointer grid place-items-center text-sm transition-colors duration-150 shrink-0 hover:bg-elevated hover:text-text" title="Focus Shutter (F)" onClick={(e) => { e.stopPropagation(); openShutter(task.id); }}>⤢</button>
              <button className="w-5 h-5 rounded-[6px] border-none bg-transparent text-muted cursor-pointer grid place-items-center text-sm transition-colors duration-150 shrink-0 hover:bg-elevated hover:text-text" title="Archive" onClick={handleArchive}>✕</button>
            </div>
          </div>
          <div className="flex-1 min-h-0 mt-2 flex flex-col">
            <TileContent task={task} />
          </div>
          <div className="flex items-center justify-between mt-2 gap-1.5 flex-wrap">
            {task.cat === 'focus' && <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-violet-dim text-violet">DEEP WORK</span>}
            {task.cat === 'fire' && <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-amber-dim text-amber">FIREFIGHT</span>}
            {task.cat === 'admin' && <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-teal-dim text-teal">ADMIN</span>}
            <div className="flex gap-[3px]">
              {sizeOptions.map(opt => (
                <button
                  key={`${opt.w}x${opt.h}`}
                  className={`font-mono text-[9px] p-[3px_6px] rounded-[5px] border border-line bg-elevated text-muted cursor-pointer hover:text-text hover:border-faint ${
                    task.w === opt.w && task.h === opt.h ? 'bg-elevated-hi text-text border-faint' : ''
                  }`}
                  onClick={(e) => handleResize(e, opt.w, opt.h)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
