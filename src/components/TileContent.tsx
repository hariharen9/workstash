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
        <div className="tile-head">
          <p className="tile-title">Holding Pen</p>
          <span className="cat-badge pen">INBOX</span>
        </div>
        <div className="tile-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {task.items && task.items.length > 0 ? (
            task.items.map((item, i) => (
              <div key={i} className="pen-item">
                <span>📥</span><span style={{ flex: 1 }}>{item}</span>
                <button className="icon-btn" onClick={() => removePenItem(task.id, i)} style={{ width: '16px', height: '16px', fontSize: '10px' }}>✕</button>
              </div>
            ))
          ) : (
            <div className="pen-empty">interruptions land here —<br />not on the grid</div>
          )}
        </div>
        <div className="add-subtask">
          <input
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
      <div className="micro-row">
        <div className="checkbox" onClick={() => archiveTask(task.id)}></div>
        <span style={{ fontSize: '11.5px', color: 'var(--muted)', flex: 1 }}>tap to complete</span>
      </div>
    );
  }

  const renderSubtasks = () => (
    <>
      <div className="subtask-list">
        {task.subtasks && task.subtasks.length > 0 ? (
          task.subtasks.map(s => (
            <div key={s.id} className={`subtask-row ${s.done ? 'done' : ''}`}>
              <div className={`checkbox ${s.done ? 'checked' : ''}`} onClick={() => toggleSubtask(task.id, s.id)}></div>
              <span className="subtask-text">{s.text}</span>
              <button className="icon-btn" onClick={() => removeSubtask(task.id, s.id)} style={{ width: '16px', height: '16px', fontSize: '10px' }}>✕</button>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--faint)', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>no subtasks yet</div>
        )}
      </div>
      <div className="add-subtask">
        <input
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
      <div className="tabs">
        <button className={`tab-btn ${task.tab === 'notes' ? 'active' : ''}`} onClick={() => setTab(task.id, 'notes')}>Scratchpad</button>
        <button className={`tab-btn ${task.tab === 'subtasks' ? 'active' : ''}`} onClick={() => setTab(task.id, 'subtasks')}>Subtasks</button>
        <button className={`tab-btn ${task.tab === 'timer' ? 'active' : ''}`} onClick={() => setTab(task.id, 'timer')}>Timer</button>
        <button className={`tab-btn ${task.tab === 'energy' ? 'active' : ''}`} onClick={() => setTab(task.id, 'energy')}>Energy</button>
      </div>
      <div className="tab-panel">
        {task.tab === 'notes' && (
          <textarea
            className="scratchpad"
            placeholder="// scratch notes, error logs, stray thoughts…"
            value={task.notes || ''}
            onChange={(e) => updateNotes(task.id, e.target.value)}
          />
        )}
        {task.tab === 'subtasks' && renderSubtasks()}
        {task.tab === 'timer' && task.timer && (
          <>
            <div className="timer-block">
              <div className="timer-display mono">{fmtTime(task.timer.remaining)}</div>
              <div className="timer-controls">
                <button onClick={() => setTimerRunning(task.id, !task.timer!.running)}>{task.timer.running ? '⏸' : '▶'}</button>
                <button onClick={() => resetTimer(task.id)}>↺</button>
                <button onClick={() => adjustTimer(task.id, -300)}>-5m</button>
                <button onClick={() => adjustTimer(task.id, 300)}>+5m</button>
              </div>
            </div>
            <div style={{ marginTop: '10px', height: '3px', background: 'var(--elevated)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--violet)', width: `${(1 - task.timer.remaining / task.timer.total) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
          </>
        )}
        {task.tab === 'energy' && (
          <>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>cognitive energy budget for this block</div>
            <div className="energy-bars">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`energy-bar ${i <= (task.energy || 3) ? 'filled' : ''}`}
                  style={{ height: `${8 + i * 3.5}px` }}
                  onClick={() => setEnergy(task.id, i)}
                ></div>
              ))}
            </div>
            <div className="progress-text" style={{ marginTop: '6px' }}>{task.energy || 3}/5 units allocated</div>
          </>
        )}
      </div>
    </>
  );
};
