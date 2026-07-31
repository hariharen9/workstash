import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, SkipForward, Settings2,
  ChevronDown, Minus, Plus, Volume2, VolumeX, Flame, Coffee, Unlink2,
} from 'lucide-react';
import { useStore, type Task } from '../store';

/* ---------------------------------------------------------------
   THE EMBER — a pomodoro timer that burns down like a coal and
   cools into a calm tide for breaks.

   Integration modes:
   A) ATTACHED — pinned to a WorkStash task. Reads time directly
      from the store (no local timer). Stays pinned when paused.
      Pin released when task is archived/completed or user detaches.
   B) STANDALONE — runs its own countdown, no task linked.
----------------------------------------------------------------*/

export type ModeKey = 'focus' | 'short' | 'long';

interface ModeMetaItem {
  label: string;
  short: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  c1: string;
  c2: string;
  glow: string;
}

const MODE_META: Record<ModeKey, ModeMetaItem> = {
  focus: { label: 'Focus', short: 'Focus', icon: Flame, c1: '#FF7A3D', c2: '#FF3B6B', glow: '255,90,70' },
  short: { label: 'Short Break', short: 'Breathe', icon: Coffee, c1: '#3FE0C0', c2: '#35A7FF', glow: '63,200,224' },
  long: { label: 'Long Break', short: 'Rest', icon: Coffee, c1: '#5B8CFF', c2: '#9B6CFF', glow: '90,120,255' },
};

const PRESETS = [
  { label: 'Classic', focus: 25, short: 5, long: 15 },
  { label: 'Deep Work', focus: 50, short: 10, long: 20 },
  { label: 'Quick', focus: 15, short: 3, long: 10 },
];

const CYCLE = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fmt = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

interface EmberRingProps {
  size: number;
  stroke: number;
  progress: number;
  meta: ModeMetaItem;
  running: boolean;
  flash: boolean;
  mini?: boolean;
  children?: React.ReactNode;
}

function EmberRing({ size, stroke, progress, meta, running, flash, mini, children }: EmberRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  const gid = mini ? 'emberGradMini' : 'emberGrad';

  return (
    <div
      className="ember-ring-wrap"
      style={{ width: size, height: size, '--glow': meta.glow } as React.CSSProperties}
    >
      <div className={`ember-glow ${running ? 'is-running' : ''} ${flash ? 'is-flash' : ''}`} />
      <svg width={size} height={size} className="ember-svg">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: meta.c1 }} />
            <stop offset="100%" style={{ stopColor: meta.c2 }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="ember-progress"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ember-content">{children}</div>
    </div>
  );
}

export const ActiveTimerWidget: React.FC = () => {
  const { tasks, setTimerRunning, resetTimer, openShutter } = useStore();

  // ── Pin logic ──────────────────────────────────────────────
  // We pin to a task when its timer starts. We KEEP the pin when
  // it pauses (so display doesn't jump). Pin releases only when
  // task completes/archives or user clicks Detach.
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null);

  // Auto-pin: whenever a new timer starts running, pin to it
  const runningTask = tasks.find(t => t.timer?.running && !t.completed);
  useEffect(() => {
    if (runningTask) {
      setPinnedTaskId(runningTask.id);
    }
  }, [runningTask?.id]);

  // Resolve pinned task — undefined if completed/archived
  const pinnedTask: Task | undefined = pinnedTaskId
    ? tasks.find(t => t.id === pinnedTaskId && !t.completed)
    : undefined;

  // If pinned task disappeared, release pin
  useEffect(() => {
    if (pinnedTaskId && !pinnedTask) setPinnedTaskId(null);
  }, [pinnedTask, pinnedTaskId]);

  // ── Standalone pomodoro state (used when NOT attached) ─────
  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15 });
  const [mode, setMode] = useState<ModeKey>('short');
  const [standaloneSeconds, setStandaloneSeconds] = useState(5 * 60);
  const [standaloneRunning, setStandaloneRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // ── Display values — source of truth depends on mode ───────
  const displaySeconds = pinnedTask
    ? (pinnedTask.timer?.remaining ?? 0)
    : standaloneSeconds;

  const displayRunning = pinnedTask
    ? (pinnedTask.timer?.running ?? false)
    : standaloneRunning;

  const displayTotal = pinnedTask
    ? (pinnedTask.timer?.total ?? 1)
    : durations[mode] * 60;

  const progress = displayTotal > 0 ? 1 - displaySeconds / displayTotal : 0;

  // ── UI state ───────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [flash, setFlash] = useState(false);

  // In attached mode, use task category for ember color
  const catMeta: Record<string, ModeMetaItem> = {
    focus: { label: 'Deep Focus', short: 'Focus', icon: Flame, c1: '#8B5CF6', c2: '#6D28D9', glow: '139,92,246' },
    fire:  { label: 'Urgent', short: 'Urgent', icon: Flame, c1: '#F59E0B', c2: '#D97706', glow: '245,158,11' },
    admin: { label: 'Quick Admin', short: 'Admin', icon: Coffee, c1: '#2DD4BF', c2: '#0D9488', glow: '45,212,191' },
  };

  const activeMeta = pinnedTask
    ? (catMeta[pinnedTask.cat] ?? MODE_META.focus)
    : MODE_META[mode];

  // ── Audio ──────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };
  const tone = (ctx: AudioContext, freq: number, start: number, dur: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.15, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.start(start);
    o.stop(start + dur + 0.05);
  };
  const chime = () => {
    if (!soundOn) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    tone(ctx, 880, t0, 0.5);
    tone(ctx, 1318.5, t0 + 0.12, 0.55);
  };
  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  // ── Standalone timer interval (only when NOT attached) ─────
  useEffect(() => {
    if (pinnedTask || !standaloneRunning) return;
    const id = setInterval(() => setStandaloneSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [pinnedTask, standaloneRunning]);

  // Standalone session complete
  useEffect(() => {
    if (pinnedTask || !standaloneRunning || standaloneSeconds > 0) return;
    const nc = mode === 'focus' ? sessionCount + 1 : sessionCount;
    if (mode === 'focus') {
      setSessionCount(nc);
      const nextMode: ModeKey = nc % CYCLE === 0 ? 'long' : 'short';
      setMode(nextMode);
      setStandaloneSeconds(durations[nextMode] * 60);
    } else {
      setMode('focus');
      setStandaloneSeconds(durations.focus * 60);
    }
    setStandaloneRunning(false);
    chime();
    triggerFlash();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standaloneSeconds, standaloneRunning, pinnedTask]);

  // ── Actions ────────────────────────────────────────────────
  const handleToggle = () => {
    if (pinnedTask) {
      const next = !pinnedTask.timer?.running;
      const ctx = getCtx();
      if (next && ctx?.state === 'suspended') ctx.resume();
      setTimerRunning(pinnedTask.id, next);
    } else {
      if (!standaloneRunning) {
        const ctx = getCtx();
        if (ctx?.state === 'suspended') ctx.resume();
      }
      setStandaloneRunning(r => !r);
    }
  };

  const handleReset = () => {
    if (pinnedTask) {
      resetTimer(pinnedTask.id);
    } else {
      setStandaloneRunning(false);
      setStandaloneSeconds(durations[mode] * 60);
    }
  };

  const handleSkip = () => {
    if (pinnedTask) {
      // In attached mode, skip just pauses and detaches
      setTimerRunning(pinnedTask.id, false);
      setPinnedTaskId(null);
    } else {
      const nc = mode === 'focus' ? sessionCount + 1 : sessionCount;
      if (mode === 'focus') setSessionCount(nc);
      const nextMode: ModeKey = mode === 'focus' ? (nc % CYCLE === 0 ? 'long' : 'short') : 'focus';
      setMode(nextMode);
      setStandaloneSeconds(durations[nextMode] * 60);
      setStandaloneRunning(false);
    }
  };

  const handleDetach = () => {
    if (pinnedTask?.timer?.running) {
      setTimerRunning(pinnedTask.id, false);
    }
    setPinnedTaskId(null);
    setMode('short');
    setStandaloneSeconds(durations.short * 60);
    setStandaloneRunning(false);
  };

  const updateDuration = (key: ModeKey, delta: number) => {
    setDurations(d => {
      const val = clamp(d[key] + delta, 1, 180);
      const nd = { ...d, [key]: val };
      if (key === mode && !standaloneRunning && !pinnedTask) setStandaloneSeconds(val * 60);
      return nd;
    });
  };

  const applyPreset = (p: { focus: number; short: number; long: number }) => {
    if (displayRunning) return;
    setDurations({ focus: p.focus, short: p.short, long: p.long });
    setSessionCount(0);
    setMode('focus');
    setStandaloneSeconds(p.focus * 60);
  };

  const goToMode = (m: ModeKey) => {
    if (pinnedTask || standaloneRunning) return;
    setMode(m);
    setStandaloneSeconds(durations[m] * 60);
  };

  // ── Particles ──────────────────────────────────────────────
  const particles = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      id: i,
      left: 18 + Math.random() * 64,
      delay: Math.random() * 3,
      dur: 2.4 + Math.random() * 1.8,
      drift: Math.random() * 24 - 12,
    })),
    []
  );

  const primaryLabel = displayRunning ? 'Pause' : (displaySeconds === 0 ? 'Restart' : 'Start');

  return (
    <div className="pomo-root" data-lenis-prevent="true">
      <style>{CSS}</style>

      {/* Collapsed orb */}
      <button
        className={`pomo-orb ${expanded ? 'is-hidden' : ''}`}
        onClick={() => setExpanded(true)}
        aria-label="Expand pomodoro timer"
      >
        <EmberRing size={72} stroke={5} progress={progress} meta={activeMeta} running={displayRunning} flash={flash} mini>
          <span className="pomo-orb-time">{fmt(displaySeconds)}</span>
          <activeMeta.icon size={11} className="pomo-orb-icon" style={{ color: activeMeta.c1 }} />
        </EmberRing>
        {displayRunning && (
          <span className="pomo-orb-pulse" style={{ background: activeMeta.c1 }} />
        )}
      </button>

      {/* Expanded card */}
      <div
        className={`pomo-card ${expanded ? 'is-open' : ''}`}
        style={{ '--c1': activeMeta.c1, '--c2': activeMeta.c2, '--glow': activeMeta.glow } as React.CSSProperties}
      >
        {/* Top bar */}
        <div className="pomo-card-top">
          {pinnedTask ? (
            <div className="pomo-attached-badge" style={{ color: activeMeta.c1 }}>
              <activeMeta.icon size={11} />
              <span className="truncate max-w-[140px]">{pinnedTask.title}</span>
            </div>
          ) : (
            <div className="pomo-tabs">
              {(Object.keys(MODE_META) as ModeKey[]).map(k => (
                <button
                  key={k}
                  className={`pomo-tab ${mode === k ? 'is-active' : ''}`}
                  style={mode === k ? { color: MODE_META[k].c1, borderColor: MODE_META[k].c1 } : undefined}
                  onClick={() => goToMode(k)}
                  disabled={standaloneRunning}
                >
                  {MODE_META[k].short}
                </button>
              ))}
            </div>
          )}
          <div className="pomo-top-actions">
            {pinnedTask && (
              <button
                className="pomo-icon-btn"
                onClick={() => openShutter(pinnedTask.id)}
                title="Open Focus Shutter"
                aria-label="Open Focus Shutter"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
            )}
            <button className="pomo-icon-btn" onClick={() => setSoundOn(s => !s)} aria-label="Toggle sound">
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            {pinnedTask && (
              <button className="pomo-icon-btn pomo-icon-btn-danger" onClick={handleDetach} title="Detach from task" aria-label="Detach from task">
                <Unlink2 size={13} />
              </button>
            )}
            <button className="pomo-icon-btn" onClick={() => setExpanded(false)} aria-label="Collapse timer">
              <ChevronDown size={15} />
            </button>
          </div>
        </div>

        {/* Particles */}
        <div
          className={`pomo-particles ${displayRunning && (pinnedTask ? pinnedTask.cat === 'fire' : mode === 'focus') ? 'is-active' : ''}`}
          style={{ '--pc': activeMeta.c1 } as React.CSSProperties}
        >
          {particles.map(p => (
            <span
              key={p.id}
              className="pomo-particle"
              style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, '--drift': `${p.drift}px` } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Ring */}
        <div className="pomo-ring-zone">
          <EmberRing size={172} stroke={8} progress={progress} meta={activeMeta} running={displayRunning} flash={flash}>
            <div className="pomo-time">{fmt(displaySeconds)}</div>
            <div className="pomo-phase">
              <activeMeta.icon size={12} style={{ color: activeMeta.c1 }} />
              {activeMeta.label}
            </div>
          </EmberRing>
        </div>

        {/* Session dots (only standalone) */}
        {!pinnedTask && (
          <div className="pomo-dots">
            {Array.from({ length: CYCLE }).map((_, i) => (
              <span
                key={i}
                className={`pomo-dot ${i < sessionCount % CYCLE ? 'is-filled' : ''}`}
                style={{ '--dc': activeMeta.c1 } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* Progress bar for attached mode */}
        {pinnedTask && (
          <div className="pomo-progress-bar-wrap">
            <div className="pomo-progress-bar" style={{ width: `${Math.min(100, progress * 100)}%`, background: `linear-gradient(90deg, ${activeMeta.c1}, ${activeMeta.c2})` }} />
          </div>
        )}

        {/* Controls */}
        <div className={`pomo-controls ${pinnedTask ? 'mb-3' : ''}`}>
          <button className="pomo-ctrl-btn" onClick={handleReset} aria-label="Reset">
            <RotateCcw size={16} />
          </button>
          <button
            className="pomo-play-btn"
            onClick={handleToggle}
            style={{ '--c1': activeMeta.c1, '--c2': activeMeta.c2 } as React.CSSProperties}
            aria-label={primaryLabel}
          >
            {displayRunning
              ? <Pause size={20} fill="currentColor" />
              : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
            }
          </button>
          <button className="pomo-ctrl-btn" onClick={handleSkip} aria-label="Skip phase">
            <SkipForward size={16} />
          </button>
        </div>

        {/* Presets + settings (only standalone) */}
        {!pinnedTask && (
          <>
            <div className="pomo-presets">
              {PRESETS.map(p => (
                <button key={p.label} className="pomo-chip" onClick={() => applyPreset(p)} disabled={displayRunning}>
                  {p.label}
                </button>
              ))}
              <button className={`pomo-chip pomo-chip-settings ${settingsOpen ? 'is-active' : ''}`} onClick={() => setSettingsOpen(s => !s)}>
                <Settings2 size={12} />
              </button>
            </div>

            <div className={`pomo-settings ${settingsOpen ? 'is-open' : ''}`}>
              {displayRunning && <div className="pomo-settings-hint">Pause to edit durations</div>}
              {(Object.keys(MODE_META) as ModeKey[]).map(k => (
                <div key={k} className="pomo-settings-row">
                  <span>{MODE_META[k].label}</span>
                  <div className="pomo-stepper">
                    <button disabled={displayRunning} onClick={() => updateDuration(k, -1)}><Minus size={12} /></button>
                    <span>{durations[k]}m</span>
                    <button disabled={displayRunning} onClick={() => updateDuration(k, 1)}><Plus size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActiveTimerWidget;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

.pomo-root{
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 999;
  font-family: 'Inter', system-ui, sans-serif;
  --panel: #17131D;
  --panel-2: #221C2B;
  --hi: #F3EFF8;
  --lo: #9089A0;
}

.pomo-orb{
  position: absolute;
  bottom: 0; left: 0;
  width: 72px; height: 72px;
  border-radius: 999px;
  border: none;
  background: var(--panel);
  cursor: pointer;
  padding: 0;
  transition: opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1);
  box-shadow: 0 8px 24px rgba(0,0,0,.45);
}
.pomo-orb.is-hidden{ opacity: 0; transform: scale(.5); pointer-events: none; }
.pomo-orb-time{
  font-family: 'Space Grotesk', monospace;
  font-size: 12px; font-weight: 600; color: var(--hi);
  font-variant-numeric: tabular-nums;
}
.pomo-orb-icon{ margin-top: 1px; }
.pomo-orb-pulse{
  position: absolute;
  top: 6px; right: 6px;
  width: 8px; height: 8px;
  border-radius: 999px;
  animation: orbPulse 1.6s ease-in-out infinite;
}
@keyframes orbPulse{
  0%,100%{ transform: scale(1); opacity: .9; }
  50%{ transform: scale(1.5); opacity: .4; }
}

.pomo-card{
  position: absolute;
  bottom: 0; left: 0;
  width: 296px;
  background: linear-gradient(180deg, var(--panel), #120F16);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 24px;
  padding: 16px 18px 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,0.02) inset;
  opacity: 0;
  transform: scale(.85) translateY(12px);
  transform-origin: bottom left;
  pointer-events: none;
  transition: opacity .32s cubic-bezier(.22,1,.36,1), transform .38s cubic-bezier(.22,1,.36,1);
}
.pomo-card.is-open{ opacity: 1; transform: scale(1) translateY(0); pointer-events: auto; }

.pomo-card-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; gap: 8px; }

.pomo-attached-badge{
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; max-width: 160px;
  overflow: hidden;
}

.pomo-tabs{ display:flex; gap: 4px; background: var(--panel-2); padding: 3px; border-radius: 999px; }
.pomo-tab{
  border: 1px solid transparent; background: transparent; color: var(--lo);
  font-size: 10.5px; font-weight: 600; padding: 5px 9px; border-radius: 999px; cursor: pointer;
  transition: all .2s ease; letter-spacing: .2px;
}
.pomo-tab.is-active{ background: rgba(255,255,255,.05); }
.pomo-tab:disabled{ cursor: default; }
.pomo-top-actions{ display:flex; gap: 4px; flex-shrink: 0; }
.pomo-icon-btn{
  width: 26px; height: 26px; display:flex; align-items:center; justify-content:center;
  border-radius: 999px; border: none; background: transparent; color: var(--lo); cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.pomo-icon-btn:hover{ background: var(--panel-2); color: var(--hi); }
.pomo-icon-btn-danger:hover{ color: #ff6b6b !important; }

.pomo-ring-zone{ display:flex; justify-content:center; margin: 6px 0 10px; position: relative; }

.ember-ring-wrap{ position: relative; display:flex; align-items:center; justify-content:center; }
.ember-glow{
  position:absolute; inset: -14%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(var(--glow),.35), rgba(var(--glow),0) 70%);
  filter: blur(6px);
  animation: breathe 4.2s ease-in-out infinite;
  opacity: .55;
}
.ember-glow.is-running{ animation-duration: 2.6s; opacity: .85; }
.ember-glow.is-flash{ animation: flashPulse .9s ease-out; opacity: 1; }
@keyframes breathe{
  0%,100%{ transform: scale(.94); opacity: .4; }
  50%{ transform: scale(1.06); opacity: .8; }
}
@keyframes flashPulse{
  0%{ transform: scale(1); opacity: .5; }
  35%{ transform: scale(1.35); opacity: 1; }
  100%{ transform: scale(1); opacity: .6; }
}
.ember-svg{ position: relative; z-index: 1; }
.ember-progress{ transition: stroke-dashoffset 1s linear; filter: drop-shadow(0 0 6px rgba(var(--glow, 255,255,255),.55)); }
.ember-content{
  position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: 2px; padding: 12px;
}
.pomo-time{
  font-family: 'Space Grotesk', monospace;
  font-size: 30px; font-weight: 700; color: var(--hi);
  font-variant-numeric: tabular-nums; line-height: 1;
}
.pomo-phase{
  display:flex; align-items:center; gap: 4px;
  font-size: 10.5px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase;
  color: var(--lo); text-align: center;
}

.pomo-particles{ position: relative; height: 0; pointer-events: none; }
.pomo-particle{
  position:absolute; bottom: 74px; width: 4px; height: 4px; border-radius: 50%;
  background: var(--pc); box-shadow: 0 0 6px var(--pc); opacity: 0;
}
.pomo-particles.is-active .pomo-particle{ animation: emberRise linear infinite; }
@keyframes emberRise{
  0%{ transform: translate(0,0) scale(.6); opacity: 0; }
  15%{ opacity: .9; }
  100%{ transform: translate(var(--drift), -92px) scale(0); opacity: 0; }
}

.pomo-dots{ display:flex; justify-content:center; gap: 6px; margin-bottom: 14px; }
.pomo-dot{ width: 5px; height: 5px; border-radius: 999px; background: rgba(255,255,255,.14); transition: all .3s ease; }
.pomo-dot.is-filled{ background: var(--dc); box-shadow: 0 0 6px var(--dc); }

.pomo-progress-bar-wrap{
  height: 3px; border-radius: 999px; background: rgba(255,255,255,.07);
  overflow: hidden; margin-bottom: 14px; border: 1px solid rgba(255,255,255,.05);
}
.pomo-progress-bar{ height: 100%; border-radius: 999px; transition: width 1s linear; }

.pomo-controls{ display:flex; align-items:center; justify-content:center; gap: 16px; margin-bottom: 14px; }
.pomo-ctrl-btn{
  width: 34px; height: 34px; border-radius: 999px; border: 1px solid rgba(255,255,255,.08);
  background: var(--panel-2); color: var(--hi); display:flex; align-items:center; justify-content:center;
  cursor: pointer; transition: transform .15s ease, background .2s ease;
}
.pomo-ctrl-btn:hover{ background: #2B2435; transform: translateY(-1px); }
.pomo-ctrl-btn:active{ transform: scale(.92); }
.pomo-play-btn{
  width: 54px; height: 54px; border-radius: 999px; border: none; cursor: pointer;
  color: #16121C;
  background: linear-gradient(135deg, var(--c1), var(--c2));
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 6px 20px rgba(0,0,0,.35);
  transition: transform .15s cubic-bezier(.22,1.5,.36,1);
}
.pomo-play-btn:hover{ transform: scale(1.06); }
.pomo-play-btn:active{ transform: scale(.94); }

.pomo-presets{ display:flex; gap: 6px; flex-wrap: wrap; }
.pomo-chip{
  flex: 1 1 auto; font-size: 10.5px; font-weight: 600; color: var(--lo);
  background: var(--panel-2); border: 1px solid rgba(255,255,255,.06); border-radius: 999px;
  padding: 7px 8px; cursor: pointer; transition: all .2s ease; white-space: nowrap;
}
.pomo-chip:hover:not(:disabled){ color: var(--hi); border-color: rgba(255,255,255,.18); }
.pomo-chip:disabled{ opacity: .4; cursor: default; }
.pomo-chip-settings{ flex: 0 0 auto; display:flex; align-items:center; justify-content:center; padding: 7px 10px; }
.pomo-chip-settings.is-active{ color: var(--hi); border-color: rgba(255,255,255,.25); }

.pomo-settings{
  max-height: 0; overflow: hidden; opacity: 0;
  transition: max-height .35s cubic-bezier(.22,1,.36,1), opacity .25s ease, margin-top .35s ease;
}
.pomo-settings.is-open{ max-height: 220px; opacity: 1; margin-top: 12px; }
.pomo-settings-hint{ font-size: 10px; color: var(--lo); margin-bottom: 8px; }
.pomo-settings-row{
  display:flex; align-items:center; justify-content:space-between;
  font-size: 11.5px; color: var(--hi); padding: 6px 0;
  border-top: 1px solid rgba(255,255,255,.05);
}
.pomo-stepper{ display:flex; align-items:center; gap: 8px; }
.pomo-stepper span{ font-family: 'Space Grotesk', monospace; font-size: 11.5px; width: 28px; text-align:center; font-variant-numeric: tabular-nums; }
.pomo-stepper button{
  width: 20px; height: 20px; border-radius: 6px; border: 1px solid rgba(255,255,255,.1);
  background: var(--panel-2); color: var(--hi); display:flex; align-items:center; justify-content:center; cursor:pointer;
}
.pomo-stepper button:disabled{ opacity: .35; cursor: default; }

@media (prefers-reduced-motion: reduce){
  .ember-glow, .pomo-particle, .ember-progress, .pomo-play-btn{ animation: none !important; transition: none !important; }
}
`;
