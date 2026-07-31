import React from 'react';
import { useStore, occupiedCells } from '../store';
import { GlowCard } from './GlowCard';

export const ArchiveModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { tasks, restoreTask, gridLayout } = useStore();

  if (!isOpen) return null;

  const archivedTasks = tasks.filter(t => t.completed && !t.isPen);

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);
  const hasGridRoom = used < TOTAL_CELLS;

  const handleRestore = (id: string) => {
    restoreTask(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-tileIn"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="blue"
        className="w-full max-w-[620px] max-h-[80vh] bg-surface rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-[1.1rem] font-display font-semibold tracking-[-0.02em] m-0">Archive</h2>
          <span className="bg-elevated text-muted text-[0.7rem] font-mono px-2 py-0.5 rounded-md border border-line">
            {archivedTasks.length} {archivedTasks.length === 1 ? 'block' : 'blocks'}
          </span>
          {!hasGridRoom && (
            <span className="ml-auto text-[0.7rem] text-amber font-medium bg-amber-dim border border-amber/20 px-2.5 py-1 rounded-lg">
              Grid full — free space to restore
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto tile-action !w-8 !h-8 !text-[1rem]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5" data-lenis-prevent="true">
          {archivedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-[2rem]">📭</span>
              <p className="text-muted text-sm m-0 text-center">Nothing archived yet.<br />Completed blocks will appear here.</p>
            </div>
          ) : (
            archivedTasks.map(task => {
              const spent = task.timer ? Math.round((task.timer.total - task.timer.remaining) / 60) : 0;
              const subtasksDone = task.subtasks?.filter(s => s.done).length ?? 0;
              const subtasksTotal = task.subtasks?.length ?? 0;
              const canRestore = used + 1 <= TOTAL_CELLS;

              return (
                <div
                  key={task.id}
                  className="bg-elevated border border-line p-4 rounded-xl flex flex-col gap-2.5 transition-all duration-200 hover:border-faint hover:bg-elevated-hi/40"
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="text-[0.875rem] font-semibold text-text m-0 leading-snug flex-1 min-w-0">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestore(task.id)}
                        disabled={!canRestore}
                        title={canRestore ? 'Restore to grid' : 'Grid is full'}
                        className={`text-[0.75rem] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 border ${
                          canRestore
                            ? 'text-teal bg-teal/10 border-teal/25 hover:bg-teal/20 hover:border-teal/40'
                            : 'text-faint bg-elevated border-line cursor-not-allowed opacity-50'
                        }`}
                      >
                        ↩ Restore
                      </button>
                    </div>
                  </div>

                  {/* Notes preview */}
                  {task.notes && task.notes.trim() && (
                    <p className="text-[0.75rem] text-muted font-mono line-clamp-2 m-0 leading-relaxed bg-void/40 rounded-lg px-2.5 py-1.5 border border-line/40">
                      {task.notes.trim()}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[0.65rem] font-mono font-semibold uppercase px-2 py-0.5 rounded-md border ${
                      task.cat === 'focus' ? 'bg-violet/10 text-violet border-violet/20' :
                      task.cat === 'fire' ? 'bg-amber/10 text-amber border-amber/20' :
                      'bg-teal/10 text-teal border-teal/20'
                    }`}>
                      {task.cat === 'focus' ? 'Deep Focus' : task.cat === 'fire' ? 'Urgent' : 'Quick Admin'}
                    </span>
                    <span className="text-[0.65rem] font-mono text-faint bg-elevated px-2 py-0.5 rounded-md border border-line/60">
                      {task.naturalW}×{task.naturalH}
                    </span>
                    {subtasksTotal > 0 && (
                      <span className="text-[0.65rem] font-mono text-faint">
                        ✓ {subtasksDone}/{subtasksTotal} tasks
                      </span>
                    )}
                    {spent > 0 && (
                      <span className="text-[0.65rem] font-mono text-faint">
                        ⏱ {spent}m spent
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlowCard>
    </div>
  );
};
