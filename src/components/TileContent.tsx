import React, { useEffect, useRef, useState } from 'react';
import { useStore, type Task } from '../store';
import { TimerControls } from './TimerControls';

const CheckIcon = () => (
  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#070A10" strokeWidth="3.5" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const TileContent: React.FC<{ task: Task; disableTick?: boolean }> = ({ task, disableTick = false }) => {
  const { setTab, updateNotes, toggleSubtask, removeSubtask, addSubtask, tickTimer, setEnergy } = useStore();
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const listAddInputRef = useRef<HTMLInputElement>(null);
  const [listAdding, setListAdding] = useState(false);

  useEffect(() => {
    if (disableTick) return;
    let interval: ReturnType<typeof setInterval>;
    if (task.timer?.running) {
      interval = setInterval(() => {
        tickTimer(task.id);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task.timer?.running, task.id, tickTimer, disableTick]);

  useEffect(() => {
    if (listAdding) listAddInputRef.current?.focus();
  }, [listAdding]);

  if (task.isPen) return null;

  // â”€â”€ Responsive layout matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const isMicro    = task.w === 1 && task.h === 1;
  const isSlimWide = task.w >= 2 && task.h === 1;    // horizontal checklist strip
  const isSlimTall = task.w === 1 && task.h >= 2;    // vertical checklist column (NEW)
  const isLarge    = task.w >= 3 && task.h >= 2;     // side-by-side split pane
  // default: wâ‰¥2 && hâ‰¥2 (and not large) â†’ tabbed interface

  if (isMicro) return null;

  const doneCount  = task.subtasks?.filter(s => s.done).length ?? 0;
  const totalCount = task.subtasks?.length ?? 0;

  const commitListItem = () => {
    const value = listAddInputRef.current?.value.trim();
    if (value) {
      addSubtask(task.id, value);
      if (listAddInputRef.current) listAddInputRef.current.value = '';
    }
    setListAdding(false);
  };

  /** Shared subtask list renderer used by several layouts. */
  const renderSubtasks = (opts?: { compact?: boolean; showInput?: boolean }) => {
    const compact   = opts?.compact ?? false;
    const showInput = opts?.showInput ?? true;
    return (
      <>
        <div className={`tile-scroll flex flex-col flex-1 ${compact ? 'gap-1' : 'gap-2'} pr-0.5`} data-lenis-prevent="true">
          {task.subtasks && task.subtasks.length > 0 ? (
            task.subtasks.map(s => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 text-text ${
                  compact
                    ? 'text-[0.78rem] leading-snug py-1 px-1 rounded-md hover:bg-elevated/70 shrink-0'
                    : 'text-[0.8125rem] leading-snug'
                }`}
              >
                <button
                  type="button"
                  className={`check-box ${s.done ? 'is-done' : ''} ${compact ? '!w-3.5 !h-3.5' : ''}`}
                  onClick={() => toggleSubtask(task.id, s.id)}
                  aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {s.done && <CheckIcon />}
                </button>
                <span className={`flex-1 min-w-0 ${s.done ? 'text-faint line-through decoration-faint/80' : ''} ${compact ? 'truncate' : ''}`}>
                  {s.text}
                </span>
                <button
                  type="button"
                  className="tile-action !w-6 !h-6 opacity-0 group-hover:opacity-100"
                  onClick={() => removeSubtask(task.id, s.id)}
                >
                  âœ•
                </button>
              </div>
            ))
          ) : (
            <div className="text-muted text-[0.78rem] py-1">No checklist items yet</div>
          )}
        </div>
        {showInput && (
          <div className="mt-1.5 shrink-0">
            <input
              className={`tile-field ${compact ? '!py-1.5 !text-[0.78rem]' : ''}`}
              type="text"
              placeholder="Add itemâ€¦"
              ref={subtaskInputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && subtaskInputRef.current?.value.trim()) {
                  addSubtask(task.id, subtaskInputRef.current.value.trim());
                  subtaskInputRef.current.value = '';
                }
              }}
            />
          </div>
        )}
      </>
    );
  };

  // â”€â”€ Slim Wide (wâ‰¥2, h=1): horizontal checklist strip â”€â”€â”€â”€â”€â”€â”€â”€
  if (isSlimWide) {
    return (
      <div className="flex flex-col h-full min-h-0 gap-1">
        <div className="flex items-center justify-between gap-2 shrink-0 h-6">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[0.7rem] font-semibold tracking-[0.04em] uppercase text-muted">Checklist</span>
            <span className="font-mono text-[0.7rem] text-faint tabular-nums">{doneCount}/{totalCount || 0}</span>
          </div>
          {!listAdding ? (
            <button
              type="button"
              className="tile-chip !px-2 !py-0.5 !text-[0.7rem] shrink-0"
              onClick={() => setListAdding(true)}
              title="Add checklist item"
            >
              + Add
            </button>
          ) : (
            <button
              type="button"
              className="tile-action !w-6 !h-6 shrink-0"
              onClick={() => setListAdding(false)}
              title="Cancel"
            >
              âœ•
            </button>
          )}
        </div>

        {totalCount > 0 && (
          <div className="h-0.5 rounded-full bg-elevated overflow-hidden shrink-0">
            <div
              className="h-full bg-teal rounded-full transition-[width] duration-300"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col rounded-lg bg-elevated/35 border border-line/50 overflow-hidden">
          <div className="tile-scroll flex-1 min-h-0 px-1.5 py-1 flex flex-col gap-0.5" data-lenis-prevent="true">
            {task.subtasks && task.subtasks.length > 0 ? (
              task.subtasks.map(s => (
                <div
                  key={s.id}
                  className="group flex items-center gap-2 text-[0.78rem] leading-snug text-text py-1 px-1 rounded-md hover:bg-elevated/80 shrink-0 min-h-[1.6rem]"
                >
                  <button
                    type="button"
                    className={`check-box !w-3.5 !h-3.5 ${s.done ? 'is-done' : ''}`}
                    onClick={() => toggleSubtask(task.id, s.id)}
                  >
                    {s.done && <CheckIcon />}
                  </button>
                  <span className={`flex-1 min-w-0 truncate ${s.done ? 'text-faint line-through' : ''}`}>{s.text}</span>
                  <button
                    type="button"
                    className="tile-action !w-5 !h-5 opacity-0 group-hover:opacity-100"
                    onClick={() => removeSubtask(task.id, s.id)}
                  >
                    âœ•
                  </button>
                </div>
              ))
            ) : (
              <div className="text-muted text-[0.75rem] py-3 px-1 m-auto text-center">
                No items â€” tap <span className="text-text font-medium">+ Add</span>
              </div>
            )}
          </div>

          {listAdding && (
            <div className="shrink-0 px-1.5 py-1 border-t border-line/50 bg-elevated/50">
              <input
                ref={listAddInputRef}
                className="tile-field !py-1 !px-2 !text-[0.75rem] !rounded-md !h-7"
                type="text"
                placeholder="Type item, Enterâ€¦"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') commitListItem();
                  if (e.key === 'Escape') setListAdding(false);
                }}
                onBlur={() => {
                  if (!listAddInputRef.current?.value.trim()) setListAdding(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€ Slim Tall (w=1, hâ‰¥2): vertical checklist column â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isSlimTall) {
    return (
      <div className="flex flex-col h-full min-h-0 gap-1.5">
        <div className="flex items-center justify-between gap-1 shrink-0">
          <span className="text-[0.65rem] font-semibold tracking-[0.04em] uppercase text-muted">Tasks</span>
          <span className="font-mono text-[0.65rem] text-faint tabular-nums">{doneCount}/{totalCount || 0}</span>
        </div>
        {totalCount > 0 && (
          <div className="h-0.5 rounded-full bg-elevated overflow-hidden shrink-0">
            <div
              className="h-full bg-teal rounded-full transition-[width] duration-300"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col rounded-lg bg-elevated/35 border border-line/50 overflow-hidden">
          <div className="tile-scroll flex-1 min-h-0 px-1 py-1 flex flex-col gap-0.5" data-lenis-prevent="true">
            {task.subtasks && task.subtasks.length > 0 ? (
              task.subtasks.map(s => (
                <div
                  key={s.id}
                  className="group flex items-start gap-1.5 text-[0.72rem] leading-snug text-text py-1 px-1 rounded-md hover:bg-elevated/80 shrink-0"
                >
                  <button
                    type="button"
                    className={`check-box !w-3 !h-3 mt-0.5 flex-shrink-0 ${s.done ? 'is-done' : ''}`}
                    onClick={() => toggleSubtask(task.id, s.id)}
                    aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {s.done && <CheckIcon />}
                  </button>
                  <span className={`flex-1 min-w-0 break-words ${s.done ? 'text-faint line-through' : ''}`}>
                    {s.text}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-muted text-[0.65rem] py-2 px-0.5 text-center leading-snug">
                No items
              </div>
            )}
          </div>
          <div className="shrink-0 px-1 py-1 border-t border-line/50">
            <input
              className="tile-field !py-1 !px-1.5 !text-[0.65rem] !rounded-md"
              type="text"
              placeholder="+ Addâ€¦"
              ref={subtaskInputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && subtaskInputRef.current?.value.trim()) {
                  addSubtask(task.id, subtaskInputRef.current.value.trim());
                  subtaskInputRef.current.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€ Large (wâ‰¥3, hâ‰¥2): side-by-side split pane â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isLarge) {
    return (
      <div className="flex flex-col h-full min-h-0 gap-2.5 relative">
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
          <div className="flex flex-col min-h-0 gap-1.5">
            <span className="text-[0.7rem] font-semibold tracking-[0.04em] uppercase text-muted shrink-0">Scratchpad</span>
            <textarea
              className="tile-field flex-1 resize-none font-mono text-[0.8125rem] leading-relaxed text-[#C8E8DC] min-h-0"
              placeholder="Notes, errors, decisionsâ€¦"
              value={task.notes || ''}
              onChange={(e) => updateNotes(task.id, e.target.value)}
              data-lenis-prevent="true"
            />
          </div>
          <div className="flex flex-col min-h-0 gap-1.5">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[0.7rem] font-semibold tracking-[0.04em] uppercase text-muted">Checklist</span>
              <span className="font-mono text-[0.7rem] text-faint tabular-nums">{doneCount}/{totalCount || 0}</span>
            </div>
            <div className="flex-1 min-h-0 flex flex-col rounded-xl bg-elevated/40 border border-line/50 p-2.5">
              {renderSubtasks({ compact: false, showInput: true })}
            </div>
          </div>
        </div>
        {task.timer && (
          <div className="shrink-0 rounded-xl bg-elevated/50 border border-line/60 px-3 py-1.5">
            <TimerControls task={task} minimal />
          </div>
        )}
      </div>
    );
  }

  // â”€â”€ Standard (wâ‰¥2, hâ‰¥2): tabbed interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tabs = [
    { id: 'notes', label: 'Notes' },
    { id: 'subtasks', label: 'Tasks' },
    { id: 'timer', label: 'Timer' },
    { id: 'energy', label: 'Energy' },
  ] as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-0.5 mb-2.5 p-0.5 rounded-xl bg-elevated/70 border border-line/60 w-fit max-w-full overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`tile-tab ${task.tab === tab.id ? 'is-active' : ''}`}
            onClick={() => setTab(task.id, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {task.tab === 'notes' && (
          <textarea
            className="tile-field flex-1 resize-none font-mono text-[0.8125rem] leading-relaxed text-[#C8E8DC] min-h-0"
            placeholder="Scratch notes, error logs, ideasâ€¦"
            value={task.notes || ''}
            onChange={(e) => updateNotes(task.id, e.target.value)}
            data-lenis-prevent="true"
          />
        )}
        {task.tab === 'subtasks' && (
          <div className="flex-1 min-h-0 flex flex-col rounded-xl bg-elevated/35 border border-line/50 p-2.5">
            {renderSubtasks({ compact: false, showInput: true })}
          </div>
        )}
        {task.tab === 'timer' && task.timer && (
          <div className="flex flex-col justify-center flex-1 min-h-0 tile-scroll">
            <TimerControls task={task} />
          </div>
        )}
        {task.tab === 'energy' && (
          <div className="flex flex-col gap-3 justify-center flex-1">
            <p className="text-[0.8125rem] text-muted m-0 leading-snug">
              Cognitive energy budget for this block
            </p>
            <div className="flex gap-1.5 items-end h-10">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  className={`flex-1 rounded-t-md border-none cursor-pointer transition-colors duration-200 ${
                    i <= (task.energy || 3) ? 'bg-violet' : 'bg-elevated hover:bg-elevated-hi'
                  }`}
                  style={{ height: `${10 + i * 5}px` }}
                  onClick={() => setEnergy(task.id, i)}
                  aria-label={`Set energy to ${i}`}
                />
              ))}
            </div>
            <p className="font-mono text-[0.75rem] text-muted m-0 tracking-wide">
              {task.energy || 3} / 5 units allocated
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
