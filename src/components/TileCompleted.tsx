import React from 'react';
import { type Task } from '../store';

interface TileCompletedProps {
  task: Task;
  onUndo: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
}

export const TileCompleted: React.FC<TileCompletedProps> = ({ task, onUndo, onArchive }) => {
  const catColor =
    task.cat === 'focus' ? 'bg-violet-dim/50 text-violet border-violet/30' :
    task.cat === 'fire' ? 'bg-amber-dim/50 text-amber border-amber/30' :
    'bg-teal-dim/50 text-teal border-teal/30';

  const catName =
    task.cat === 'focus' ? 'Focus' :
    task.cat === 'fire' ? 'Urgent' : 'Admin';

  const wasSize = `${task.naturalW}×${task.naturalH}`;

  return (
    <div className="flex flex-col h-full items-center justify-between p-2.5 relative min-h-0 select-none">
      {/* Top Bar: Action Buttons & Badge */}
      <div className="flex items-center justify-between w-full shrink-0 gap-1">
        <span className={`font-mono text-[0.6rem] font-semibold uppercase px-1.5 py-0.5 rounded border ${catColor}`}>
          ✓ {catName}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="tile-action !w-auto !h-6 !px-2 text-[0.68rem] font-mono font-semibold text-teal bg-teal/10 hover:bg-teal/25 border border-teal/30 rounded-md transition-all flex items-center gap-1"
            title="Undo: restore task to original size"
            onClick={onUndo}
            aria-label={`Undo ${task.title}`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="tile-action !w-6 !h-6 hover:!text-danger"
            title="Archive immediately"
            onClick={onArchive}
            aria-label={`Archive ${task.title}`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center: Clear Task Title */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-1 py-1 min-h-0 text-center">
        <p className="font-display font-semibold text-[0.825rem] leading-snug tracking-[-0.015em] text-text/90 m-0 break-words line-clamp-2">
          {task.title}
        </p>
      </div>

      {/* Bottom Row: Satisfying Message & Original Size Tag */}
      <div className="flex items-center justify-between w-full shrink-0 pt-1 border-t border-line/40 text-[0.62rem] font-mono text-muted">
        <span className="text-teal font-medium flex items-center gap-1">
          ✦ Done
        </span>
        <span className="text-faint" title={`Original block size: ${wasSize}`}>
          was {wasSize}
        </span>
      </div>
    </div>
  );
};
