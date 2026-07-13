import React from 'react';
import { useStore } from '../store';

const Heatmap = () => {
  const days = Array.from({ length: 56 }, (_, i) => {
    const isRecent = i > 40;
    const rand = Math.random();
    const level = isRecent 
      ? (rand > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0) 
      : (rand > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0);
    return { id: i, level };
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Cognitive Focus Map</h3>
        <span className="text-xs font-mono text-violet">32 Pomodoros</span>
      </div>
      <div className="p-4 bg-surface border border-line rounded-2xl flex justify-center overflow-hidden h-40 items-center">
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {days.map(d => {
            let bgClass = 'bg-elevated';
            let opacityClass = 'opacity-50';
            
            if (d.level === 1) { bgClass = 'bg-violet'; opacityClass = 'opacity-30'; }
            if (d.level === 2) { bgClass = 'bg-violet'; opacityClass = 'opacity-60'; }
            if (d.level === 3) { bgClass = 'bg-violet'; opacityClass = 'opacity-80'; }
            if (d.level === 4) { bgClass = 'bg-violet'; opacityClass = 'opacity-100'; }
            
            return (
              <div 
                key={d.id} 
                className={`w-3 h-3 rounded-sm ${bgClass} ${opacityClass} hover:ring-1 hover:ring-text cursor-crosshair transition-all`}
                title={`${d.level} sessions`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EnergyChart = () => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Energy Allocation</h3>
      <div className="p-5 bg-surface border border-line rounded-2xl flex items-center justify-between h-40">
        {/* CSS Donut Chart */}
        <div 
          className="w-24 h-24 rounded-full relative shrink-0 flex items-center justify-center" 
          style={{ background: 'conic-gradient(#8B7CF6 0% 65%, #F5A623 65% 85%, #5EEAD4 85% 100%)' }}
        >
          {/* Inner hole */}
          <div className="absolute inset-2 rounded-full bg-surface flex items-center justify-center">
            <span className="text-lg font-display font-bold">14h</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1 ml-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-violet"></span><span className="text-muted">Deep Work</span></div>
            <span className="font-mono text-text">65%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber"></span><span className="text-muted">Firefight</span></div>
            <span className="font-mono text-text">20%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal"></span><span className="text-muted">Admin</span></div>
            <span className="font-mono text-text">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PomodoroWidget = () => {
  const { tasks, setTimerRunning } = useStore();
  const activeTask = tasks.find(t => t.timer && t.timer.running && !t.completed) 
                  || tasks.find(t => t.timer && t.timer.remaining > 0 && !t.completed);

  if (!activeTask || !activeTask.timer) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Global Timer</h3>
        <div className="p-5 bg-surface border border-line rounded-2xl flex items-center justify-center h-48 text-muted text-sm font-mono">
          [ No active timers ]
        </div>
      </div>
    );
  }

  const mins = Math.floor(activeTask.timer.remaining / 60);
  const secs = activeTask.timer.remaining % 60;
  const progress = ((activeTask.timer.total - activeTask.timer.remaining) / activeTask.timer.total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Global Timer</h3>
      <div className="p-5 bg-surface border border-line rounded-2xl flex flex-col items-center justify-center h-48 relative overflow-hidden group">
        <div className="absolute inset-y-0 left-0 bg-violet/[0.08] transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
        
        <div className="relative z-10 flex flex-col items-center gap-1 w-full px-4">
          <span className="text-xs text-muted font-mono truncate w-full text-center">{activeTask.title}</span>
          <div className="text-[44px] font-display font-bold tracking-tight text-text leading-none mt-1">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </div>
          
          <button 
            className={`mt-4 px-6 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors shadow-sm ${activeTask.timer.running ? 'bg-faint text-text hover:bg-muted' : 'bg-violet text-white hover:bg-violet/80'}`}
            onClick={() => setTimerRunning(activeTask.id, !activeTask.timer!.running)}
          >
            {activeTask.timer.running ? 'Pause' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ActivityLog = () => {
  const { activityLogs } = useStore();

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-mono tracking-widest text-muted uppercase">Activity Log</h3>
      <div 
        className="p-5 bg-surface border border-line rounded-2xl flex flex-col gap-5 h-48 overflow-y-auto"
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
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  return (
    <section className="min-h-screen w-full snap-start shrink-0 flex flex-col p-8 md:p-12 bg-gradient-to-b from-white/[0.02] to-void border-t border-white/[0.05] shadow-[inset_0_1px_0_rgba(0,0,0,0.4)] relative z-0">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8 mt-4 md:mt-12">
        <header className="flex items-baseline justify-between border-b border-line pb-4">
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Workspace Analytics</h2>
          <span className="font-mono text-muted text-xs tracking-widest uppercase">Live Telemetry</span>
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
