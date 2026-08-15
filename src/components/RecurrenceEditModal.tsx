import React, { useState } from 'react';
import {
  useStore,
  recurrenceLabel,
  defaultRecurrence,
  DAY_NAMES,
  type Task,
  type Recurrence,
  type RecurrenceFrequency,
} from '../store';
import { GlowCard } from './GlowCard';

const FREQUENCIES: { id: RecurrenceFrequency; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const RecurrenceEditModal: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
  const { updateRecurrence, promoteRecurringTask } = useStore();
  const [recurrence, setRecurrence] = useState<Recurrence>(
    task.recurrence || defaultRecurrence()
  );

  const handleSave = () => {
    updateRecurrence(task.id, recurrence);
    onClose();
  };

  const toggleWeekday = (d: number) => {
    setRecurrence(r => ({
      ...r,
      days: r.days.includes(d) ? r.days.filter(x => x !== d) : [...r.days, d].sort(),
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="purple"
        className="w-full max-w-[440px] bg-surface rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-display font-semibold tracking-tight m-0">Edit Recurrence</h2>
            <p className="text-[0.8125rem] text-muted m-0 mt-1">{task.title}</p>
          </div>
          <button onClick={onClose} className="tile-action !w-8 !h-8 !text-[1rem]" aria-label="Close">✕</button>
        </div>

        <div>
          <label className="text-[0.7rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
            Frequency
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {FREQUENCIES.map(f => (
              <button
                key={f.id}
                type="button"
                className={`py-2 rounded-lg text-[0.75rem] font-semibold border cursor-pointer transition-all ${
                  recurrence.frequency === f.id
                    ? 'bg-violet text-void border-violet/40'
                    : 'bg-elevated border-line text-muted hover:text-text hover:border-faint'
                }`}
                onClick={() => setRecurrence(r => ({ ...r, frequency: f.id }))}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {recurrence.frequency === 'weekly' && (
          <div>
            <label className="text-[0.7rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
              Days
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_NAMES.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  className={`w-9 h-9 rounded-lg text-[0.72rem] font-semibold border cursor-pointer transition-all ${
                    recurrence.days.includes(i)
                      ? 'bg-violet text-void border-violet/40'
                      : 'bg-elevated border-line text-muted hover:text-text hover:border-faint'
                  }`}
                  onClick={() => toggleWeekday(i)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[0.7rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
              Time
            </label>
            <input
              type="time"
              className="tile-field"
              value={recurrence.time || '09:00'}
              onChange={e => setRecurrence(r => ({ ...r, time: e.target.value || null }))}
            />
          </div>
          {recurrence.frequency === 'monthly' ? (
            <div>
              <label className="text-[0.7rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
                Day of month
              </label>
              <input
                type="number"
                min={1}
                max={31}
                className="tile-field"
                value={recurrence.monthDay ?? 1}
                onChange={e => setRecurrence(r => ({ ...r, monthDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) }))}
              />
            </div>
          ) : (
            <div>
              <label className="text-[0.7rem] text-muted block mb-2 font-semibold tracking-[0.04em] uppercase">
                Every
              </label>
              <input
                type="number"
                min={1}
                max={30}
                className="tile-field"
                value={recurrence.interval}
                onChange={e => setRecurrence(r => ({ ...r, interval: Math.min(30, Math.max(1, Number(e.target.value) || 1)) }))}
              />
            </div>
          )}
        </div>

        <p className="m-0 text-[0.72rem] text-faint font-mono leading-snug">
          ⟳ {recurrenceLabel(recurrence)}
        </p>

        <div className="flex gap-2 justify-end mt-1">
          <button
            type="button"
            className="cursor-pointer font-semibold text-[0.8125rem] py-2.5 px-4 rounded-[10px] transition-all duration-200 bg-elevated text-muted border border-line hover:text-text hover:border-faint"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="border-none cursor-pointer font-semibold text-[0.8125rem] py-2.5 px-4 rounded-[10px] transition-all duration-200 bg-violet text-void hover:bg-violet/90"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            className="cursor-pointer font-semibold text-[0.8125rem] py-2.5 px-3 rounded-[10px] transition-all duration-200 bg-teal-dim text-teal border border-teal/30 hover:bg-teal/20"
            onClick={() => { promoteRecurringTask(task.id); onClose(); }}
          >
            Do now
          </button>
        </div>
      </GlowCard>
    </div>
  );
};
