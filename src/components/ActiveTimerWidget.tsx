import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const ActiveTimerWidget: React.FC = () => {
  const { tasks, setTimerRunning, resetTimer, openShutter } = useStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const prevTaskIdRef = useRef<string | null>(null);

  const activeTask = tasks.find(t => t.timer?.running && !t.completed);
  const timer = activeTask?.timer;

  // Show/hide with animation
  useEffect(() => {
    if (activeTask) {
      // New task started — reset dismiss
      if (activeTask.id !== prevTaskIdRef.current) {
        setDismissed(false);
        prevTaskIdRef.current = activeTask.id;
      }
      setVisible(true);
    } else {
      setVisible(false);
      prevTaskIdRef.current = null;
    }
  }, [activeTask?.id, activeTask]);

  if (!activeTask || !timer || dismissed) return null;

  const pct = timer.total > 0 ? ((timer.total - timer.remaining) / timer.total) * 100 : 0;
  const isDone = timer.remaining === 0;

  // Color shifts from violet → amber as time runs out
  const urgencyColor = pct > 80
    ? '#F59E0B'  // amber when >80% elapsed
    : pct > 60
    ? '#A78BFA'  // lighter violet
    : '#8B5CF6'; // violet

  const catColors: Record<string, string> = {
    focus: '#8B5CF6',
    fire: '#F59E0B',
    admin: '#2DD4BF',
  };
  const dotColor = catColors[activeTask.cat] ?? '#8B5CF6';

  return (
    <div
      className={`fixed bottom-6 left-6 z-[45] transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div
        className="relative flex items-center gap-3 bg-surface/95 border border-line rounded-2xl px-4 py-3 shadow-shutter backdrop-blur-xl cursor-pointer group"
        style={{ boxShadow: `0 0 0 1px ${urgencyColor}22, 0 8px 32px -8px ${urgencyColor}33, 0 2px 8px rgba(0,0,0,0.4)` }}
        onClick={() => openShutter(activeTask.id)}
        title="Click to open Focus Shutter"
      >
        {/* Animated pulse ring */}
        <div className="relative shrink-0">
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ background: dotColor, animationDuration: '1.8s' }}
          />
          <span
            className="relative w-2.5 h-2.5 rounded-full block"
            style={{ background: dotColor }}
          />
        </div>

        {/* Timer digits */}
        <div className="flex flex-col min-w-0">
          <div
            className="font-display font-bold tabular-nums text-[1.3rem] leading-none tracking-[-0.03em] transition-colors duration-1000"
            style={{ color: isDone ? '#F59E0B' : urgencyColor }}
          >
            {fmtTime(timer.remaining)}
          </div>
          <p className="text-[0.68rem] text-muted font-medium m-0 mt-0.5 truncate max-w-[140px]">
            {activeTask.title}
          </p>
        </div>

        {/* Progress arc bar */}
        <div className="w-16 h-1 rounded-full bg-elevated/80 overflow-hidden shrink-0 border border-line/40">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%`, background: urgencyColor }}
          />
        </div>

        {/* Pause/Play button */}
        <button
          type="button"
          className="shrink-0 w-7 h-7 rounded-lg border border-line bg-elevated flex items-center justify-center text-muted hover:text-text hover:border-faint transition-all duration-150 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (isDone) {
              resetTimer(activeTask.id);
              setTimerRunning(activeTask.id, true);
            } else {
              setTimerRunning(activeTask.id, false);
            }
          }}
          title={isDone ? 'Restart' : 'Pause'}
        >
          {isDone ? (
            // Restart icon
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          ) : (
            // Pause icon
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          )}
        </button>

        {/* Dismiss × */}
        <button
          type="button"
          className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-faint hover:text-muted transition-colors duration-150 cursor-pointer opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setDismissed(true);
          }}
          title="Hide widget"
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Subtle sweep animation on the border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse opacity-20"
          style={{ boxShadow: `inset 0 0 0 1px ${urgencyColor}` }}
        />
      </div>
    </div>
  );
};
