import React, { useState } from 'react';
import { Settings, RotateCcw, X } from 'lucide-react';
import { useStore, type Task } from '../store';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
] as const;

interface TimerControlsProps {
  task: Task;
  compact?: boolean;
  minimal?: boolean;
}

export const TimerControls: React.FC<TimerControlsProps> = ({ task, compact = false, minimal = false }) => {
  const { setTimerRunning, resetTimer, adjustTimer, setTimerDuration } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const timer = task.timer;
  if (!timer) return null;

  const isRunning = timer.running;
  const isPausedMid = !isRunning && timer.remaining > 0 && timer.remaining < timer.total;
  const isFresh = timer.remaining === timer.total;
  const isDone = timer.remaining === 0;

  const primaryLabel = isRunning ? 'Pause' : isPausedMid ? 'Continue' : isDone ? 'Restart' : 'Start';
  const primaryAction = () => {
    if (isDone) {
      resetTimer(task.id);
      setTimerRunning(task.id, true);
      return;
    }
    setTimerRunning(task.id, !isRunning);
  };

  if (minimal) {
    return (
      <div className="w-full">
        {/* Minimal Bar */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group/timer flex-1"
            onClick={() => setIsExpanded(true)}
            title="Click to expand timer controls"
          >
            <div className="font-display font-semibold tabular-nums text-[1.1rem] leading-none text-text group-hover/timer:text-violet transition-colors">
              {fmtTime(timer.remaining)}
            </div>
            <div className="w-16 sm:w-24 h-1.5 rounded-full bg-elevated border border-line/50 overflow-hidden shrink-0">
              <div
                className="h-full bg-violet rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[0.7rem] text-muted font-medium shrink-0 hidden sm:inline">
              {isRunning ? 'Running' : isPausedMid ? 'Paused' : isDone ? 'Finished' : `${Math.round(timer.total / 60)}m`}
            </span>
            <Settings className="w-3 h-3 text-faint group-hover/timer:text-muted transition-colors shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className={`tile-chip !px-2.5 !py-1 !text-[0.75rem] !font-semibold ${
                isRunning ? '' : '!bg-violet !border-violet/40 !text-void'
              }`}
              onClick={primaryAction}
            >
              {primaryLabel}
            </button>
            {!isFresh && (
              <button
                type="button"
                className="tile-chip !px-2 !py-1 !text-[0.7rem] flex items-center justify-center"
                onClick={() => resetTimer(task.id)}
                title="Restart"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Expanded Popover Sheet */}
        {isExpanded && (
          <div className="absolute inset-x-0 -bottom-1 z-40 bg-surface/98 backdrop-blur-xl border border-line rounded-2xl p-4 shadow-shutter animate-tileIn flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet animate-pulse" />
                <span className="font-mono text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-text">Timer Controls</span>
              </div>
              <button
                type="button"
                className="tile-action !w-6 !h-6 !text-[0.8rem] flex items-center justify-center"
                onClick={() => setIsExpanded(false)}
                title="Close timer settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display font-bold text-[1.65rem] tabular-nums tracking-tight leading-none text-text">
                  {fmtTime(timer.remaining)}
                </div>
                <p className="text-[0.72rem] text-muted m-0 mt-1 font-medium">
                  {isRunning ? 'Timer Running' : isPausedMid ? 'Paused Mid-session' : isDone ? 'Session Complete' : `Target · ${Math.round(timer.total / 60)} min`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={`tile-chip !px-3.5 !py-2 !text-[0.8125rem] !font-semibold ${
                    isRunning ? '!bg-elevated-hi !text-text' : '!bg-violet !border-violet/40 !text-void'
                  }`}
                  onClick={primaryAction}
                >
                  {primaryLabel}
                </button>
                <button
                  type="button"
                  className="tile-chip !px-3 !py-2 !text-[0.78rem]"
                  onClick={() => resetTimer(task.id)}
                  disabled={isFresh && !isRunning}
                  title="Restart timer"
                >
                  Restart
                </button>
              </div>
            </div>

            <div className="bg-elevated rounded-full overflow-hidden border border-line/50 h-1.5">
              <div
                className="h-full bg-violet rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0}%` }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[0.6875rem] font-semibold tracking-[0.04em] uppercase text-muted">Set Duration</span>
              <div className="flex gap-1.5 flex-wrap items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      className={`tile-chip !px-2.5 !py-1 !text-[0.75rem] ${timer.total === p.seconds && isFresh ? 'is-active' : ''}`}
                      onClick={() => setTimerDuration(task.id, p.seconds)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap items-center">
                  <button type="button" className="tile-chip !px-2 !py-1 !text-[0.72rem]" onClick={() => adjustTimer(task.id, -60)} title="-1 minute">−1m</button>
                  <button type="button" className="tile-chip !px-2 !py-1 !text-[0.72rem]" onClick={() => adjustTimer(task.id, 60)} title="+1 minute">+1m</button>
                  <button type="button" className="tile-chip !px-2 !py-1 !text-[0.72rem]" onClick={() => adjustTimer(task.id, -300)} title="-5 minutes">−5m</button>
                  <button type="button" className="tile-chip !px-2 !py-1 !text-[0.72rem]" onClick={() => adjustTimer(task.id, 300)} title="+5 minutes">+5m</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3.5'} w-full`}>
      <div className={`flex items-end justify-between gap-3 flex-wrap ${compact ? '' : ''}`}>
        <div>
          <div className={`font-display font-semibold tabular-nums tracking-tight leading-none ${compact ? 'text-[1.25rem]' : 'text-[2rem] tracking-[-0.03em]'}`}>
            {fmtTime(timer.remaining)}
          </div>
          <p className="text-[0.7rem] text-muted m-0 mt-1.5 font-medium">
            {isRunning ? 'Running' : isPausedMid ? 'Paused' : isDone ? 'Finished' : `Set · ${Math.round(timer.total / 60)} min`}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button
            type="button"
            className={`tile-chip !px-3 !py-1.5 !text-[0.75rem] !font-semibold ${
              isRunning ? '' : '!bg-violet !border-violet/40 !text-void'
            }`}
            onClick={primaryAction}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className="tile-chip !px-2.5 !py-1.5"
            title="Restart from the set duration"
            onClick={() => resetTimer(task.id)}
            disabled={isFresh && !isRunning}
          >
            Restart
          </button>
        </div>
      </div>

      <div className={`bg-elevated rounded-full overflow-hidden border border-line/50 ${compact ? 'h-1' : 'h-1.5'}`}>
        <div
          className="h-full bg-violet rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0}%` }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.04em] uppercase text-muted">Set duration</span>
        <div className="flex gap-1.5 flex-wrap items-center">
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              className={`tile-chip !px-2.5 !py-1 ${timer.total === p.seconds && isFresh ? 'is-active' : ''}`}
              onClick={() => setTimerDuration(task.id, p.seconds)}
              title={`Set to ${p.label}`}
            >
              {p.label}
            </button>
          ))}
          <span className="w-px h-4 bg-line mx-0.5" />
          <button
            type="button"
            className="tile-chip !px-2 !py-1"
            onClick={() => adjustTimer(task.id, -60)}
            title="Minus 1 minute"
          >
            −1
          </button>
          <button
            type="button"
            className="tile-chip !px-2 !py-1"
            onClick={() => adjustTimer(task.id, 60)}
            title="Plus 1 minute"
          >
            +1
          </button>
          <button
            type="button"
            className="tile-chip !px-2 !py-1"
            onClick={() => adjustTimer(task.id, -300)}
            title="Minus 5 minutes"
          >
            −5
          </button>
          <button
            type="button"
            className="tile-chip !px-2 !py-1"
            onClick={() => adjustTimer(task.id, 300)}
            title="Plus 5 minutes"
          >
            +5
          </button>
        </div>
      </div>
    </div>
  );
};
