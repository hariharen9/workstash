import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore, type Task } from '../store';

interface Match {
  task: Task;
  score: number;
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += 10 - qi;
      if (i === 0 || t[i - 1] === ' ' || t[i - 1] === '-' || t[i - 1] === '_') score += 5;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

export const CommandPalette: React.FC = () => {
  const { tasks, openShutter, addToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allTasks = useMemo(() => tasks, [tasks]);

  const matches = useMemo(() => {
    if (!query.trim()) {
      return allTasks.filter(t => !t.isPen).map(t => ({ task: t, score: 1 }));
    }
    const results: Match[] = [];
    for (const task of allTasks) {
      if (task.isPen) continue;
      const titleScore = fuzzyScore(query, task.title);
      const catScore = fuzzyScore(query, task.cat === 'focus' ? 'deep focus' : task.cat === 'fire' ? 'urgent' : 'admin');
      const best = Math.max(titleScore, catScore);
      if (best > 0) results.push({ task, score: best });
    }
    results.sort((a, b) => b.score - a.score);
    return results;
  }, [query, allTasks]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [matches]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
  }, [isOpen]);

  const selectTask = (task: Task, openShutterMode = false) => {
    setIsOpen(false);
    setQuery('');
    if (openShutterMode) {
      openShutter(task.id);
    } else {
      const el = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'box-shadow 0.3s ease';
        const orig = el.style.boxShadow;
        el.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.7), 0 0 24px rgba(139,92,246,0.3)';
        setTimeout(() => { el.style.boxShadow = orig; }, 1500);
      } else {
        addToast('Task is in archive — scroll down to restore', '📦');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-[#05070C]/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={containerRef}
        className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[81] w-full max-w-[560px] bg-elevated-hi border border-line rounded-2xl shadow-shutter flex flex-col overflow-hidden animate-toastIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 pb-2 border-b border-line/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-text text-[0.95rem] font-medium placeholder:text-muted"
            placeholder="Search tasks... (↑↓ to navigate, ↵ to jump, Ctrl+↵ to open shutter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, matches.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (matches[selectedIndex]) {
                  selectTask(matches[selectedIndex].task, e.ctrlKey || e.metaKey);
                }
              } else if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          />
          <span className="text-[0.7rem] font-mono text-muted bg-elevated border border-line rounded-md px-2 py-0.5 leading-none">Esc</span>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {matches.length === 0 ? (
            <div className="text-muted text-sm text-center py-8 font-mono">No matching tasks</div>
          ) : (
            matches.map((m, i) => {
              const t = m.task;
              const catColor =
                t.cat === 'focus' ? 'bg-violet-dim text-violet' :
                t.cat === 'fire' ? 'bg-amber-dim text-amber' :
                'bg-teal-dim text-teal';
              const catLabel =
                t.cat === 'focus' ? 'Focus' :
                t.cat === 'fire' ? 'Urgent' :
                'Admin';

              return (
                <button
                  key={t.id}
                  type="button"
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border-none cursor-pointer transition-colors duration-100 ${
                    i === selectedIndex ? 'bg-violet-dim/70 text-text' : 'bg-transparent text-text hover:bg-elevated/80'
                  }`}
                  onClick={() => selectTask(t, false)}
                  onContextMenu={(e) => { e.preventDefault(); selectTask(t, true); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className={`font-mono text-[0.625rem] font-semibold tracking-[0.04em] uppercase px-1.5 py-0.5 rounded-md shrink-0 ${catColor}`}>
                    {catLabel}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[0.875rem] font-medium">
                    {t.title}
                  </span>
                  <span className="text-[0.7rem] text-muted font-mono shrink-0">
                    {t.w}×{t.h}{t.completed ? ' · done' : ''}
                  </span>
                  <span className="text-[0.65rem] text-faint font-mono shrink-0 hidden sm:block">
                    ↵ jump · Ctrl+↵ open
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
