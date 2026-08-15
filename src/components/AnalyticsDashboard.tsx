import React, { useMemo, useState } from 'react';
import { useStore, sessionsByDay, energyAllocation, sessionStats, type ActivityLog } from '../store';
import { GlowCard } from './GlowCard';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  Archive,
  RotateCcw,
  Clock,
  Hash,
  Search,
  Flame,
  Zap,
  Activity,
  Repeat,
} from 'lucide-react';

const Heatmap = () => {
  const focusSessions = useStore(s => s.focusSessions);
  const days = useMemo(() => sessionsByDay(focusSessions, 56), [focusSessions]);
  const stats = useMemo(() => sessionStats(focusSessions), [focusSessions]);

  const max = Math.max(1, ...days.map(d => d.count));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.72rem] font-semibold tracking-[0.08em] text-muted uppercase">Cognitive Focus Map</h3>
        <span className="text-xs font-mono text-violet font-semibold">
          {stats.count} Pomodoro{stats.count === 1 ? '' : 's'}
        </span>
      </div>
      <GlowCard customSize glowColor="purple" className="p-4 bg-surface rounded-2xl flex justify-center overflow-hidden h-44 items-center">
        {stats.count === 0 ? (
          <div className="text-muted text-xs font-mono text-center px-4 leading-relaxed">
            Complete a timer to start building your 8-week focus heatmap
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
      <h3 className="text-[0.72rem] font-semibold tracking-[0.08em] text-muted uppercase">Energy Allocation</h3>
      <GlowCard customSize glowColor="blue" className="p-4 bg-surface rounded-2xl flex items-center justify-between h-44">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full relative shrink-0 flex items-center justify-center shadow-md"
          style={{ background: gradient }}
        >
          <div className="absolute inset-2 rounded-full bg-surface flex items-center justify-center">
            <span className="text-base sm:text-lg font-display font-bold text-text">{hoursLabel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1 ml-4 sm:ml-5">
          {!hasBudget ? (
            <div className="text-muted text-xs font-mono">No active energy budget — assign energy to blocks</div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet"></span><span className="text-muted">Deep Focus</span></div>
                <span className="font-mono font-semibold text-text">{Math.round(pf)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber"></span><span className="text-muted">Urgent</span></div>
                <span className="font-mono font-semibold text-text">{Math.round(pFire)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal"></span><span className="text-muted">Quick Admin</span></div>
                <span className="font-mono font-semibold text-text">{Math.round(pAdmin)}%</span>
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
        <GlowCard customSize glowColor="orange" className="p-5 bg-surface rounded-2xl flex items-center justify-center h-44 text-muted text-xs font-mono">
          No active block timer
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
      <GlowCard customSize glowColor="orange" className="p-4 bg-surface rounded-2xl flex flex-col items-center justify-center h-44 relative overflow-hidden group">
        <div className="absolute inset-y-0 left-0 bg-violet/[0.08] transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />

        <div className="relative z-10 flex flex-col items-center gap-1 w-full px-2">
          <span className="text-[0.75rem] text-muted font-mono truncate w-full text-center">{activeTask.title}</span>
          <div className="text-[34px] sm:text-[38px] font-display font-bold tracking-tight text-text leading-none mt-1 tabular-nums">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </div>
          <p className="text-[0.68rem] text-muted m-0 font-medium">
            {timer.running ? 'Running' : isPausedMid ? 'Paused' : timer.remaining === 0 ? 'Finished' : 'Ready'}
          </p>

          <div className="mt-2 flex gap-2">
            <button
              className={`px-4 py-1.5 rounded-lg font-semibold text-[0.7rem] uppercase tracking-wider transition-all shadow-sm cursor-pointer border-none ${
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
              className="px-3 py-1.5 rounded-lg font-semibold text-[0.7rem] uppercase tracking-wider transition-colors bg-elevated text-muted border border-line hover:text-text cursor-pointer"
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

// ─── Sophisticated Timeline Stream ──────────────────────────────────────────
const Timeline = () => {
  const { activityLogs } = useStore();
  const [filterType, setFilterType] = useState<'all' | 'focus' | 'fire' | 'admin' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesType = filterType === 'all' || log.type === filterType;
      const matchesSearch = !searchQuery.trim() || log.msg.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [activityLogs, filterType, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: activityLogs.length,
      focus: activityLogs.filter(l => l.type === 'focus').length,
      fire: activityLogs.filter(l => l.type === 'fire').length,
      admin: activityLogs.filter(l => l.type === 'admin').length,
      system: activityLogs.filter(l => l.type === 'system').length,
    };
  }, [activityLogs]);

  // Helper to pick event icon & accent based on log message text
  const getEventMeta = (log: ActivityLog) => {
    const msg = log.msg.toLowerCase();
    if (msg.includes('completed') || msg.includes('done')) {
      return { icon: CheckCircle2, color: 'text-teal', bg: 'bg-teal/15', border: 'border-teal/30', label: 'Completed' };
    }
    if (msg.includes('defrag') || msg.includes('swept')) {
      return { icon: Sparkles, color: 'text-violet', bg: 'bg-violet/15', border: 'border-violet/30', label: 'Defrag' };
    }
    if (msg.includes('archived')) {
      return { icon: Archive, color: 'text-amber', bg: 'bg-amber/15', border: 'border-amber/30', label: 'Archived' };
    }
    if (msg.includes('reopened') || msg.includes('restored')) {
      return { icon: RotateCcw, color: 'text-sky-400', bg: 'bg-sky-400/15', border: 'border-sky-400/30', label: 'Restored' };
    }
    if (msg.includes('tag')) {
      return { icon: Hash, color: 'text-violet', bg: 'bg-violet/15', border: 'border-violet/30', label: 'Tag' };
    }
    if (msg.includes('recurring') || msg.includes('rhythm')) {
      return { icon: Repeat, color: 'text-violet', bg: 'bg-violet/15', border: 'border-violet/30', label: 'Rhythm' };
    }
    if (msg.includes('created') || msg.includes('added')) {
      return { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-400/15', border: 'border-emerald-400/30', label: 'Created' };
    }
    if (log.type === 'focus') {
      return { icon: Zap, color: 'text-violet', bg: 'bg-violet/15', border: 'border-violet/30', label: 'Deep Focus' };
    }
    if (log.type === 'fire') {
      return { icon: Flame, color: 'text-amber', bg: 'bg-amber/15', border: 'border-amber/30', label: 'Urgent' };
    }
    return { icon: Activity, color: 'text-muted', bg: 'bg-elevated', border: 'border-line', label: 'Event' };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header bar with filters & search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/60 p-3 sm:p-4 rounded-2xl border border-line">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal/15 text-teal border border-teal/30 flex items-center justify-center shrink-0">
            <Activity size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text tracking-tight m-0">
                Workspace Timeline
              </h3>
              <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] font-bold px-2 py-0.2 rounded-full bg-teal-dim text-teal border border-teal/25 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                Live Stream
              </span>
            </div>
            <p className="text-[0.72rem] text-muted m-0 mt-0.5">
              Chronological log of spatial shifts, focus cycles, and task completions
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Search timeline..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-elevated/70 border border-line rounded-xl text-[0.75rem] text-text placeholder:text-faint focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet/30 transition-all font-mono"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { id: 'all', label: 'All Events', count: counts.all },
          { id: 'focus', label: '⚡ Focus', count: counts.focus },
          { id: 'fire', label: '🔥 Urgent', count: counts.fire },
          { id: 'admin', label: '🧹 Admin', count: counts.admin },
          { id: 'system', label: '⚙️ System', count: counts.system },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as typeof filterType)}
            className={`px-3 py-1.5 rounded-xl text-[0.72rem] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === tab.id
                ? 'bg-elevated-hi text-text border-faint shadow-sm'
                : 'bg-surface/50 text-muted border-line hover:text-text hover:border-faint'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono text-[0.65rem] opacity-70 bg-void/50 px-1.5 py-0.2 rounded-md">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Stream Container */}
      <GlowCard
        customSize
        glowColor="purple"
        className="p-4 sm:p-5 bg-surface rounded-2xl flex flex-col max-h-[440px] overflow-y-auto overflow-x-hidden w-full"
        data-lenis-prevent="true"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-elevated border border-line flex items-center justify-center text-faint mb-3">
              <Clock size={20} />
            </div>
            <h4 className="text-sm font-semibold text-text m-0 mb-1">No timeline events found</h4>
            <p className="text-[0.75rem] text-muted max-w-sm m-0">
              {searchQuery ? `No events match "${searchQuery}".` : 'Complete tasks, set tags, or run a defrag ritual to build your timeline history.'}
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col w-full min-w-0">
            <div className="flex flex-col gap-2.5 w-full">
              {filteredLogs.map((log) => {
                const meta = getEventMeta(log);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-2.5 sm:gap-3.5 group/entry transition-all duration-200 py-0.5 w-full min-w-0"
                  >
                    {/* Timestamp */}
                    <div className="w-14 sm:w-16 text-right font-mono text-[0.7rem] sm:text-[0.72rem] text-faint group-hover/entry:text-muted shrink-0 tabular-nums select-none">
                      {log.time}
                    </div>

                    {/* Timeline Node Dot */}
                    <div className="relative z-10 w-7 h-7 rounded-xl bg-surface border border-line flex items-center justify-center shrink-0 group-hover/entry:scale-105 group-hover/entry:border-faint transition-all shadow-sm">
                      <IconComponent size={13} className={meta.color} />
                    </div>

                    {/* Event Content Card */}
                    <div className="flex-1 min-w-0 bg-elevated/40 hover:bg-elevated-hi/70 border border-line/60 hover:border-line rounded-xl p-2 sm:px-3.5 sm:py-2.5 transition-all flex items-center justify-between gap-2.5 overflow-hidden">
                      <span className="text-[0.78rem] sm:text-[0.8125rem] text-text font-medium truncate">
                        {log.msg}
                      </span>
                      <span
                        className={`font-mono text-[0.6rem] sm:text-[0.62rem] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase border ${meta.bg} ${meta.color} ${meta.border}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GlowCard>
    </div>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  return (
    <section className="min-h-screen w-full shrink-0 flex flex-col p-6 sm:p-8 md:p-12 bg-void relative z-0">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-6 mt-4 md:mt-8">
        <header className="flex items-baseline justify-between border-b border-line pb-5">
          <div>
            <h2 className="font-display text-2xl md:text-[2rem] font-bold tracking-[-0.03em] m-0 text-text">
              Workspace Analytics
            </h2>
            <p className="text-muted text-[0.825rem] m-0 mt-1">
              Live cognitive telemetry, energy distribution, and spatial timeline history.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="font-mono text-muted text-[0.7rem] tracking-[0.08em] uppercase font-semibold">
              Live Telemetry
            </span>
          </div>
        </header>

        {/* 3 Top Telemetry Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Heatmap />
          <EnergyChart />
          <PomodoroWidget />
        </div>

        {/* Full-Width Sophisticated Timeline */}
        <div className="mt-2">
          <Timeline />
        </div>
      </div>
    </section>
  );
};
