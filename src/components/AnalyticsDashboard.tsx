import React, { useMemo } from 'react';
import { useStore, sessionsByDay, energyAllocation, sessionStats } from '../store';
import { GlowCard } from './GlowCard';

const Heatmap = () => {
  const focusSessions = useStore(s => s.focusSessions);
  const days = useMemo(() => sessionsByDay(focusSessions, 56), [focusSessions]);
  const stats = useMemo(() => sessionStats(focusSessions), [focusSessions]);

  const max = Math.max(1, ...days.map(d => d.count));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.72rem] font-semibold tracking-[0.08em] text-muted uppercase">Cognitive Focus Map</h3>
        <span className="text-xs font-mono text-violet">
          {stats.count} Pomodoro{stats.count === 1 ? '' : 's'}
        </span>
      </div>
      <GlowCard customSize glowColor="purple" className="p-4 bg-surface rounded-2xl flex justify-center overflow-hidden h-40 items-center">
        {stats.count === 0 ? (
          <div className="text-muted text-sm font-mono text-center px-4">
            Complete a timer to start building your focus map
          </div>
        ) : (
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {days.map(d => {
              const level = d.count === 0 ? 0 : Math.min(4, Math.ceil((d.count / max) * 4));
              let bgClass = 'bg-elevated';
              let opacityClass = 'opacity-50';

              if (level === 1) { bgClass = 'bg-violet'; opacityClass = 'opacity-30'; }
              if (level === 2) { bgClass = 'bg-violet'; opacityClass = 'opacity-60'; }
              if (level === 3) { bgClass = 'bg-violet'; opacityClass = 'opacity-80'; }
              if (level === 4) { bgClass = 'bg-violet'; opacityClass = 'opacity-100'; }

              return (
                <div
                  key={d.date}
                  className={`w-3 h-3 rounded-sm ${bgClass} ${opacityClass} hover:ring-1 hover:ring-text cursor-crosshair transition-all`}
                  title={`${d.date}: ${d.count} session${d.count === 1 ? '' : 's'}`}
                />
              );
            })}
          </div>
        )}
      </GlowCard>
    </div>
  );
};

const EnergyChart = () => {
  const tasks = useStore(s => s.tasks);
  const focusSessions = useStore(s => s.focusSessions);
  const alloc = useMemo(() => energyAllocation(tasks), [tasks]);
  const stats = useMemo(() => sessionStats(focusSessions), [focusSessions]);

  const hasBudget = alloc.total > 0;
  const pf = hasBudget ? (alloc.focus / alloc.total) * 100 : 0;
  const pFire = hasBudget ? (alloc.fire / alloc.total) * 100 : 0;
  const pAdmin = hasBudget ? (alloc.admin / alloc.total) * 100 : 0;

  const hoursLabel = stats.totalHours > 0
    ? `${stats.totalHours < 10 ? stats.totalHours.toFixed(1) : Math.round(stats.totalHours)}h`
    : hasBudget
      ? `${alloc.totalHours < 10 ? alloc.totalHours.toFixed(1) : Math.round(alloc.totalHours)}h`
      : '0h';

  const gradient = hasBudget
    ? `conic-gradient(#8B7CF6 0% ${pf}%, #F5A623 ${pf}% ${pf + pFire}%, #5EEAD4 ${pf + pFire}% 100%)`
    : 'conic-gradient(#232B3D 0% 100%)';

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Energy Allocation</h3>
      <GlowCard customSize glowColor="blue" className="p-5 bg-surface rounded-2xl flex items-center justify-between h-40">
        <div
          className="w-24 h-24 rounded-full relative shrink-0 flex items-center justify-center"
          style={{ background: gradient }}
        >
          <div className="absolute inset-2 rounded-full bg-surface flex items-center justify-center">
            <span className="text-lg font-display font-bold">{hoursLabel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 ml-6">
          {!hasBudget ? (
            <div className="text-muted text-sm font-mono">No active energy budget — set energy on your tiles</div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-violet"></span><span className="text-muted">Deep Focus</span></div>
                <span className="font-mono text-text">{Math.round(pf)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber"></span><span className="text-muted">Urgent</span></div>
                <span className="font-mono text-text">{Math.round(pFire)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal"></span><span className="text-muted">Quick Admin</span></div>
                <span className="font-mono text-text">{Math.round(pAdmin)}%</span>
              </div>
            </>
          )}
        </div>
      </GlowCard>
    </div>
  );
};

const PomodoroWidget = () => {
  const { tasks, setTimerRunning, resetTimer } = useStore();
  const activeTask = tasks.find(t => t.timer && t.timer.running && !t.completed)
                  || tasks.find(t => t.timer && t.timer.remaining > 0 && timerStarted(t) && !t.completed)
                  || tasks.find(t => t.timer && !t.completed && !t.isPen);

  if (!activeTask || !activeTask.timer) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-[0.72rem] font-semibold tracking-[0.08em] text-muted uppercase">Global Timer</h3>
        <GlowCard customSize glowColor="orange" className="p-5 bg-surface rounded-2xl flex items-center justify-center h-48 text-muted text-sm font-mono">
          [ No timers yet ]
        </GlowCard>
      </div>
    );
  }

  const timer = activeTask.timer;
  const mins = Math.floor(timer.remaining / 60);
  const secs = timer.remaining % 60;
  const progress = ((timer.total - timer.remaining) / timer.total) * 100;
  const isPausedMid = !timer.running && timer.remaining > 0 && timer.remaining < timer.total;
  const primary = timer.running ? 'Pause' : isPausedMid ? 'Continue' : timer.remaining === 0 ? 'Restart' : 'Start';

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[0.72rem] font-semibold tracking-[0.08em] text-muted uppercase">Global Timer</h3>
      <GlowCard customSize glowColor="orange" className="p-5 bg-surface rounded-2xl flex flex-col items-center justify-center h-48 relative overflow-hidden group">
        <div className="absolute inset-y-0 left-0 bg-violet/[0.08] transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />

        <div className="relative z-10 flex flex-col items-center gap-1 w-full px-4">
          <span className="text-xs text-muted font-mono truncate w-full text-center">{activeTask.title}</span>
          <div className="text-[44px] font-display font-bold tracking-tight text-text leading-none mt-1 tabular-nums">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </div>
          <p className="text-[0.7rem] text-muted m-0 font-medium">
            {timer.running ? 'Running' : isPausedMid ? 'Paused' : timer.remaining === 0 ? 'Finished' : 'Ready'}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              className={`px-5 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer border-none ${
                timer.running ? 'bg-faint text-text hover:bg-muted' : 'bg-violet text-void hover:bg-violet/80'
              }`}
              onClick={() => {
                if (timer.remaining === 0) {
                  resetTimer(activeTask.id);
                  setTimerRunning(activeTask.id, true);
                } else {
                  setTimerRunning(activeTask.id, !timer.running);
                }
              }}
            >
              {primary}
            </button>
            <button
              className="px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors bg-elevated text-muted border border-line hover:text-text cursor-pointer"
              onClick={() => resetTimer(activeTask.id)}
            >
              Restart
            </button>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

function timerStarted(t: { timer?: { remaining: number; total: number } }) {
  return !!t.timer && t.timer.remaining < t.timer.total;
}

const ActivityLog = () => {
  const { activityLogs } = useStore();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Activity Log</h3>
      <GlowCard
        customSize
        glowColor="green"
        className="p-5 bg-surface rounded-2xl flex flex-col gap-5 h-48 overflow-y-auto"
        data-lenis-prevent="true"
      >
        {activityLogs.length === 0 && <div className="text-muted text-sm italic">No telemetry data.</div>}
        {activityLogs.map((log, i) => {
          let dot = 'bg-faint';
          if (log.type === 'focus') dot = 'bg-violet shadow-brand';
          if (log.type === 'fire') dot = 'bg-amber';
          if (log.type === 'admin') dot = 'bg-teal';
          if (log.type === 'rest') dot = 'bg-blue-400';

          return (
            <div key={log.id} className="flex items-start gap-4 text-sm">
              <div className="w-12 text-muted font-mono text-[11px] pt-1 shrink-0">{log.time}</div>
              <div className="flex flex-col items-center gap-1.5 self-stretch">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                {i !== activityLogs.length - 1 && <div className="w-px h-full bg-line" />}
              </div>
              <div className="text-text pt-0.5">{log.msg}</div>
            </div>
          );
        })}
      </GlowCard>
    </div>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  return (
    <section className="min-h-screen w-full shrink-0 flex flex-col p-8 md:p-12 bg-void relative z-0">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8 mt-4 md:mt-12">
        <header className="flex items-baseline justify-between border-b border-line pb-5">
          <h2 className="font-display text-2xl md:text-[2rem] font-semibold tracking-[-0.03em] m-0">Workspace Analytics</h2>
          <span className="font-mono text-muted text-[0.7rem] tracking-[0.08em] uppercase font-medium">Live Telemetry</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Heatmap />
          <EnergyChart />
          <PomodoroWidget />
          <ActivityLog />
        </div>
      </div>
    </section>
  );
};
