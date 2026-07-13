import React, { useEffect, useRef } from 'react';
import { useStore, type Task } from '../store';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const TileContent: React.FC<{ task: Task }> = ({ task }) => {
  const { archiveTask, setTab, updateNotes, toggleSubtask, removeSubtask, addSubtask, setTimerRunning, tickTimer, resetTimer, adjustTimer, setEnergy, addPenItem, removePenItem } = useStore();
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const penInputRef = useRef<HTMLInputElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (task.timer?.running) {
      interval = setInterval(() => {
        tickTimer(task.id);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [task.timer?.running, task.id, tickTimer]);

  if (task.isPen) {
    return (
      <>
        <div className="flex items-start justify-between gap-2">
          <p className="font-display font-semibold text-[13.5px] leading-1.3 tracking-[-0.01em] m-0 break-words">Holding Pen</p>
          <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-faint text-text">INBOX</span>
        </div>
        <div className="flex-1 min-h-0 mt-2 flex flex-col">
          {task.items && task.items.length > 0 ? (
            task.items.map((item, i) => (
              <div key={i} className="flex items-center gap-[7px] text-[11.5px] bg-elevated p-[6px_8px] rounded-[7px] mb-[5px]">
                <span>📥</span><span style={{ flex: 1 }}>{item}</span>
                <button className="w-4 h-4 rounded-[5px] border-none bg-transparent text-muted cursor-pointer grid place-items-center text-[10px] transition-colors duration-150 shrink-0 hover:bg-elevated-hi hover:text-text" onClick={() => removePenItem(task.id, i)}>✕</button>
              </div>
            ))
          ) : (
            <div className="text-faint text-[11.5px] font-mono m-auto text-center">interruptions land here —<br />not on the grid</div>
          )}
        </div>
        <div className="flex gap-[6px] mt-[6px]">
          <input
            className="flex-1 bg-elevated border border-line text-text text-[11.5px] p-[6px_8px] rounded-[7px] outline-none font-sans focus:border-faint"
            type="text"
            placeholder="+ capture a stray thought…"
            ref={penInputRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && penInputRef.current?.value.trim()) {
                addPenItem(task.id, penInputRef.current.value.trim());
                penInputRef.current.value = '';
              }
            }}
          />
        </div>
      </>
    );
  }

  const area = task.w * task.h;

  if (area <= 1) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <div 
          className="w-4 h-4 rounded-[5px] border-[1.5px] border-faint shrink-0 cursor-pointer grid place-items-center transition-all duration-150 hover:bg-teal hover:border-teal" 
          onClick={() => archiveTask(task.id)}
        ></div>
        <span className="text-[11.5px] text-muted flex-1">tap to complete</span>
      </div>
    );
  }

  const renderSubtasks = () => (
    <>
      <div className="flex flex-col gap-[5px] overflow-y-auto flex-1 pr-[2px]">
        {task.subtasks && task.subtasks.length > 0 ? (
          task.subtasks.map(s => (
            <div key={s.id} className="flex items-center gap-[7px] text-xs text-text">
              <div 
                className={`w-4 h-4 rounded-[5px] border-[1.5px] shrink-0 cursor-pointer grid place-items-center transition-all duration-150 ${
                  s.done ? 'bg-teal border-teal' : 'border-faint'
                }`} 
                onClick={() => toggleSubtask(task.id, s.id)}
              >
                {s.done && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#0A0D14" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`flex-1 ${s.done ? 'text-faint line-through' : ''}`}>{s.text}</span>
              <button className="w-4 h-4 rounded-[5px] border-none bg-transparent text-muted cursor-pointer grid place-items-center text-[10px] transition-colors duration-150 shrink-0 hover:bg-elevated hover:text-text" onClick={() => removeSubtask(task.id, s.id)}>✕</button>
            </div>
          ))
        ) : (
          <div className="text-faint text-[11px] font-mono">no subtasks yet</div>
        )}
      </div>
      <div className="flex gap-[6px] mt-[6px]">
        <input
          className="flex-1 bg-elevated border border-line text-text text-[11.5px] p-[6px_8px] rounded-[7px] outline-none font-sans focus:border-faint"
          type="text"
          placeholder="+ add subtask, press Enter"
          ref={subtaskInputRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && subtaskInputRef.current?.value.trim()) {
              addSubtask(task.id, subtaskInputRef.current.value.trim());
              subtaskInputRef.current.value = '';
            }
          }}
        />
      </div>
    </>
  );

  if (area <= 2) {
    return renderSubtasks();
  }

  // 2x2 or 3x2 (tabbed workspace)
  return (
    <>
      <div className="flex gap-1 mb-2">
        <button className={`text-[10.5px] p-[5px_9px] rounded-[6px] border-none bg-transparent text-muted cursor-pointer font-sans font-medium ${task.tab === 'notes' ? 'bg-elevated text-text' : ''}`} onClick={() => setTab(task.id, 'notes')}>Scratchpad</button>
        <button className={`text-[10.5px] p-[5px_9px] rounded-[6px] border-none bg-transparent text-muted cursor-pointer font-sans font-medium ${task.tab === 'subtasks' ? 'bg-elevated text-text' : ''}`} onClick={() => setTab(task.id, 'subtasks')}>Subtasks</button>
        <button className={`text-[10.5px] p-[5px_9px] rounded-[6px] border-none bg-transparent text-muted cursor-pointer font-sans font-medium ${task.tab === 'timer' ? 'bg-elevated text-text' : ''}`} onClick={() => setTab(task.id, 'timer')}>Timer</button>
        <button className={`text-[10.5px] p-[5px_9px] rounded-[6px] border-none bg-transparent text-muted cursor-pointer font-sans font-medium ${task.tab === 'energy' ? 'bg-elevated text-text' : ''}`} onClick={() => setTab(task.id, 'energy')}>Energy</button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {task.tab === 'notes' && (
          <textarea
            className="flex-1 bg-elevated border border-line rounded-[9px] p-[8px_9px] font-mono text-[11px] text-[#B8E6D5] resize-none outline-none w-full leading-normal placeholder-faint focus:border-teal"
            placeholder="// scratch notes, error logs, stray thoughts…"
            value={task.notes || ''}
            onChange={(e) => updateNotes(task.id, e.target.value)}
          />
        )}
        {task.tab === 'subtasks' && renderSubtasks()}
        {task.tab === 'timer' && task.timer && (
          <>
            <div className="flex items-center gap-[10px]">
              <div className="font-mono text-xl font-medium tracking-[0.02em]">{fmtTime(task.timer.remaining)}</div>
              <div className="flex gap-[5px]">
                <button className="w-6 h-6 rounded-[7px] border border-line bg-elevated text-text cursor-pointer text-[11px] grid place-items-center hover:bg-elevated-hi" onClick={() => setTimerRunning(task.id, !task.timer!.running)}>{task.timer.running ? '⏸' : '▶'}</button>
                <button className="w-6 h-6 rounded-[7px] border border-line bg-elevated text-text cursor-pointer text-[11px] grid place-items-center hover:bg-elevated-hi" onClick={() => resetTimer(task.id)}>↺</button>
                <button className="w-6 h-6 rounded-[7px] border border-line bg-elevated text-text cursor-pointer text-[11px] grid place-items-center hover:bg-elevated-hi" onClick={() => adjustTimer(task.id, -300)}>-5m</button>
                <button className="w-6 h-6 rounded-[7px] border border-line bg-elevated text-text cursor-pointer text-[11px] grid place-items-center hover:bg-elevated-hi" onClick={() => adjustTimer(task.id, 300)}>+5m</button>
              </div>
            </div>
            <div className="mt-2.5 h-[3px] bg-elevated rounded-[2px] overflow-hidden">
              <div className="h-full bg-violet transition-[width] duration-1000 ease-linear" style={{ width: `${(1 - task.timer.remaining / task.timer.total) * 100}%` }}></div>
            </div>
          </>
        )}
        {task.tab === 'energy' && (
          <>
            <div className="text-[11px] text-muted mb-2">cognitive energy budget for this block</div>
            <div className="flex gap-[3px] items-end h-[26px] flex-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`flex-1 rounded-[3px_3px_0_0] bg-elevated cursor-pointer transition-colors duration-200 ${
                    i <= (task.energy || 3) ? 'bg-violet' : ''
                  }`}
                  style={{ height: `${8 + i * 3.5}px` }}
                  onClick={() => setEnergy(task.id, i)}
                ></div>
              ))}
            </div>
            <div className="font-mono text-[10.5px] text-muted mt-1.5">{task.energy || 3}/5 units allocated</div>
          </>
        )}
      </div>
    </>
  );
};
