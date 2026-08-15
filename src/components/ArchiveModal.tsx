import React, { useEffect } from 'react';
import { useStore, occupiedCells } from '../store';
import { GlowCard } from './GlowCard';

export const ArchiveModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { tasks, restoreTask, gridLayout } = useStore();
  const [filterTag, setFilterTag] = React.useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFilterTag(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allArchived = tasks.filter(t => t.archived && !t.isPen);
  const archivedTags = Array.from(new Set(allArchived.flatMap(t => t.tags || []))).sort();

  const archivedTasks = filterTag
    ? allArchived.filter(t => t.tags && t.tags.includes(filterTag))
    : allArchived;

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);
  const hasGridRoom = used < TOTAL_CELLS;

  const handleRestore = (id: string) => {
    restoreTask(id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="blue"
        data-lenis-prevent="true"
        className="w-full max-w-[660px] max-h-[85vh] bg-surface rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-line shrink-0">
          <h2 className="text-[1.1rem] font-display font-semibold tracking-[-0.02em] m-0">Archive</h2>
          <span className="bg-elevated text-muted text-[0.7rem] font-mono px-2 py-0.5 rounded-md border border-line">
            {allArchived.length} {allArchived.length === 1 ? 'block' : 'blocks'}
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

        {/* Tag Filter Chips Bar */}
        {archivedTags.length > 0 && (
          <div className="px-6 py-2 border-b border-line/60 bg-elevated/40 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-[0.68rem] text-muted font-mono shrink-0">Tags:</span>
            <button
              type="button"
              className={`text-[0.68rem] font-mono px-2 py-0.5 rounded-md border cursor-pointer transition-all ${
                filterTag === null
                  ? 'bg-text text-void font-semibold border-text'
                  : 'bg-elevated text-muted hover:text-text border-line'
              }`}
              onClick={() => setFilterTag(null)}
            >
              All ({allArchived.length})
            </button>
            {archivedTags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`text-[0.68rem] font-mono px-2 py-0.5 rounded-md border cursor-pointer transition-all ${
                  filterTag === tag
                    ? 'bg-violet text-void font-semibold border-violet shadow-sm'
                    : 'bg-elevated text-violet/90 hover:text-violet border-line'
                }`}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              >
                {tag} ({allArchived.filter(t => t.tags?.includes(tag)).length})
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto tile-scroll p-4 flex flex-col gap-2.5 min-h-0"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          {archivedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-[2rem]">📭</span>
              <p className="text-muted text-sm m-0 text-center">
                {filterTag ? `No archived blocks found with tag ${filterTag}.` : 'Nothing archived yet. Completed blocks will appear here.'}
              </p>
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
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {task.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-[0.625rem] font-mono font-semibold px-1.5 py-0.5 rounded bg-violet/10 border border-violet/20 text-violet"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
