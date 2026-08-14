import React, { useMemo, useState } from 'react';
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

export const RecurringDock: React.FC = () => {
  const { tasks, wakeRecurringTask, snoozeTask, completeTaskNow } = useStore();
  const [editing, setEditing] = useState<string | null>(null);

  const recurring = useMemo(
    () => tasks.filter(t => t.recurrence && !t.archived).sort((a, b) => {
      const aDue = a.nextDue ? parseIsoLocal(a.nextDue).getTime() : Infinity;
      const bDue = b.nextDue ? parseIsoLocal(b.nextDue).getTime() : Infinity;
      return aDue - bDue;
    }),
    [tasks]
  );

  if (recurring.length === 0) return null;

  const nowCount = recurring.filter(t => t.nextDue && parseIsoLocal(t.nextDue).getTime() <= Date.now()).length;

  return (
    <>
      <GlowCard
        customSize
        glowColor="purple"
        className="shrink-0 mx-[18px] mb-[18px] mt-0 bg-surface/95 rounded-2xl border border-line/80 shadow-tile overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line/70">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-[0.6875rem] font-semibold tracking-[0.06em] uppercase text-violet bg-violet-dim px-2 py-1 rounded-md border border-violet/30">
              Rhythm
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[0.9rem] m-0 tracking-[-0.02em] leading-none">
                Recurring Tasks
              </p>
              <p className="text-[0.72rem] text-muted m-0 mt-1 truncate">
                Surface when due, re-arm after completion
              </p>
            </div>
          </div>
          {nowCount > 0 && (
            <span className="font-mono text-[0.7rem] text-amber bg-amber-dim border border-amber/30 px-2 py-0.5 rounded-md">
              {nowCount} due
            </span>
          )}
        </div>

        <div className="px-4 py-3 flex gap-2.5 overflow-x-auto overflow-y-hidden">
          {recurring.map(task => {
            const streak = streakForTask(task);
            const isDormant = task.dormant;
            return (
              <div
                key={task.id}
                className={`shrink-0 w-[240px] rounded-xl border p-3 flex flex-col gap-2 transition-colors ${
                  isDormant ? 'bg-elevated/40 border-line/60' : 'bg-elevated border-violet/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${isDormant ? 'bg-faint' : 'bg-violet'}`} />
                  <span className="flex-1 min-w-0 text-[0.8125rem] font-semibold text-text truncate">
                    {task.title}
                  </span>
                  {streak > 0 && (
                    <span className="font-mono text-[0.65rem] text-amber shrink-0" title={`${streak} day streak`}>
                      {streak}🔥
                    </span>
                  )}
                </div>

                <div className="font-mono text-[0.68rem] text-faint leading-snug">
                  {recurrenceLabel(task.recurrence!)}
                </div>

                <div className="flex items-center gap-1 mt-auto">
                  {isDormant ? (
                    <button
                      type="button"
                      className="tile-chip !px-2 !py-1 !text-[0.7rem] shrink-0"
                      onClick={() => wakeRecurringTask(task.id)}
                    >
                      Bring now
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="tile-chip !px-2 !py-1 !text-[0.7rem] !bg-violet !border-violet/40 !text-void shrink-0"
                        onClick={() => completeTaskNow(task.id)}
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        className="tile-chip !px-2 !py-1 !text-[0.7rem] shrink-0"
                        onClick={() => snoozeTask(task.id, 2)}
                      >
                        +2h
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="tile-chip !px-2 !py-1 !text-[0.7rem] shrink-0"
                    onClick={() => setEditing(task.id)}
                  >
                    Edit
                  </button>
                  <span className="ml-auto font-mono text-[0.65rem] text-faint">{relativeDue(task)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>
      {editing && (
        <RecurrenceEditModal
          task={recurring.find(t => t.id === editing)!}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};
