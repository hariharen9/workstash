import React, { useEffect, useMemo, useState } from 'react';
import {
  useStore,
  recurrenceLabel,
  streakForTask,
  parseIsoLocal,
  type Task,
} from '../store';
import { GlowCard } from './GlowCard';
import { RecurrenceEditModal } from './RecurrenceEditModal';

function relativeDue(task: Task): string {
  if (!task.nextDue) return 'scheduled';
  const due = parseIsoLocal(task.nextDue);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  if (diff <= 0) return 'now';
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export const RhythmModal: React.FC<{ isOpen: boolean; onClose: () => void; onNewTask: () => void }> = ({ isOpen, onClose, onNewTask }) => {
  const { tasks, snoozeTask, promoteRecurringTask, deleteRecurringTask } = useStore();
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const recurring = useMemo(
    () => tasks.filter(t => t.recurrence).sort((a, b) => {
      const aDue = a.nextDue ? parseIsoLocal(a.nextDue).getTime() : Infinity;
      const bDue = b.nextDue ? parseIsoLocal(b.nextDue).getTime() : Infinity;
      return aDue - bDue;
    }),
    [tasks]
  );

  if (!isOpen) return null;

  const nowCount = recurring.filter(t => t.nextDue && parseIsoLocal(t.nextDue).getTime() <= Date.now()).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="purple"
        data-lenis-prevent="true"
        className="w-full max-w-[680px] max-h-[82vh] bg-surface rounded-2xl flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6875rem] font-semibold tracking-[0.06em] uppercase text-violet bg-violet-dim px-2 py-1 rounded-md border border-violet/30">
              Rhythm
            </span>
            <h2 className="text-[1.1rem] font-display font-semibold tracking-[-0.02em] m-0">Recurring Tasks</h2>
          </div>
          <span className="bg-elevated text-muted text-[0.7rem] font-mono px-2 py-0.5 rounded-md border border-line">
            {recurring.length} {recurring.length === 1 ? 'rhythm' : 'rhythms'}
          </span>
          {nowCount > 0 && (
            <span className="text-[0.7rem] text-amber font-medium bg-amber-dim border border-amber/20 px-2.5 py-1 rounded-lg">
              {nowCount} due
            </span>
          )}
          <button
            onClick={onNewTask}
            className="ml-auto cursor-pointer font-semibold text-[0.8125rem] py-2 px-3.5 rounded-[10px] transition-all duration-200 flex items-center gap-1.5 bg-violet text-void hover:bg-violet/90"
          >
            + New Rhythm
          </button>
          <button onClick={onClose} className="tile-action !w-8 !h-8 !text-[1rem]" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 min-h-0" data-lenis-prevent="true" onWheel={(e) => e.stopPropagation()}>
          {recurring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-[2rem]">🔄</span>
              <p className="text-muted text-sm m-0 text-center">
                No recurring tasks yet.<br />Create a rhythm for daily, weekly, or monthly routines.
              </p>
              <button
                type="button"
                className="cursor-pointer font-semibold text-[0.8125rem] py-2.5 px-4 rounded-[10px] bg-violet text-void hover:bg-violet/90"
                onClick={onNewTask}
              >
                + Create Rhythm
              </button>
            </div>
          ) : (
            recurring.map(task => {
              const streak = streakForTask(task);
              return (
                <div key={task.id} className="bg-elevated border border-line p-4 rounded-xl flex flex-col gap-3 transition-all duration-200 hover:border-faint hover:bg-elevated-hi/40">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet shrink-0" />
                        <h3 className="text-[0.875rem] font-semibold text-text m-0 leading-snug truncate">{task.title}</h3>
                      </div>
                      <p className="text-[0.75rem] text-muted m-0 mt-1 font-mono">{recurrenceLabel(task.recurrence!)}</p>
                    </div>
                    {streak > 0 && (
                      <span className="font-mono text-[0.68rem] text-amber bg-amber-dim border border-amber/30 px-2 py-0.5 rounded-md shrink-0" title={`${streak} occurrence streak`}>
                        {streak}🔥
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      className="tile-chip !px-2.5 !py-1 !text-[0.72rem] !bg-violet !border-violet/40 !text-void shrink-0"
                      onClick={() => promoteRecurringTask(task.id)}
                      title="Move a one-off copy onto the grid and advance the schedule"
                    >
                      Do now
                    </button>
                    <button
                      type="button"
                      className="tile-chip !px-2.5 !py-1 !text-[0.72rem] shrink-0"
                      onClick={() => snoozeTask(task.id, 2)}
                    >
                      +2h
                    </button>
                    <button
                      type="button"
                      className="tile-chip !px-2.5 !py-1 !text-[0.72rem] shrink-0"
                      onClick={() => setEditing(task.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="tile-chip !px-2.5 !py-1 !text-[0.72rem] !hover:!text-danger shrink-0"
                      onClick={() => deleteRecurringTask(task.id)}
                      title="Remove this recurring task"
                    >
                      Remove
                    </button>
                    <span className="ml-auto font-mono text-[0.65rem] text-faint">{relativeDue(task)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlowCard>

      {editing && (
        <RecurrenceEditModal
          task={recurring.find(t => t.id === editing)!}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};
