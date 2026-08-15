import React, { useEffect, useState } from 'react';
import { GlowCard } from './GlowCard';
import {
  HelpCircle,
  Compass,
  Layers,
  Keyboard,
  Sparkles,
  Flame,
  Zap,
  Inbox,
  Clock,
  RotateCcw,
  X,
  Rocket,
} from 'lucide-react';
import { useStore } from '../store';
import { playClick } from '../sounds';

type HelpTab = 'philosophy' | 'blocks' | 'workflows' | 'shortcuts';

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('philosophy');
  const soundsEnabled = useStore((s) => s.soundsEnabled);
  const startOnboardingTour = useStore((s) => s.startOnboardingTour);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: { id: HelpTab; label: string; icon: React.ReactNode }[] = [
    { id: 'philosophy', label: 'Philosophy', icon: <Compass size={14} /> },
    { id: 'blocks', label: 'Bento Blocks', icon: <Layers size={14} /> },
    { id: 'workflows', label: 'Workflows', icon: <Zap size={14} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={14} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="purple"
        className="w-full max-w-[680px] bg-surface/98 backdrop-blur-2xl border border-line rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-2xl relative max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet/15 text-violet border border-violet/30 flex items-center justify-center shadow-brand">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold tracking-tight text-text leading-tight m-0">
                WorkStash Guide & Shortcuts
              </h2>
              <p className="text-xs text-muted m-0 mt-0.5">
                Spatial task philosophy, bento blocks, topology modes, and hotkeys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tile-action !w-8 !h-8 !rounded-xl"
            aria-label="Close guide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-elevated/80 border border-line/70 rounded-2xl shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id);
                if (soundsEnabled) playClick();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-elevated-hi text-text shadow-sm border border-line/80 font-bold'
                  : 'text-muted hover:text-text hover:bg-elevated'
              }`}
            >
              <span className={activeTab === t.id ? 'text-violet' : 'text-faint'}>{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 tile-scroll min-h-[300px] text-[0.84rem] text-muted leading-relaxed">
          {/* ─── TAB 1: PHILOSOPHY ─── */}
          {activeTab === 'philosophy' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-elevated/60 border border-line/80 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet flex items-center gap-1.5">
                  <Sparkles size={14} /> The Spatial Paradigm
                </span>
                <p className="text-text font-medium m-0 leading-snug">
                  Traditional todo apps are infinite vertical lists where tasks get buried and mental overload compounds.
                </p>
                <p className="m-0 text-xs">
                  WorkStash treats tasks as <strong>physical blocks</strong> on a bounded 2D Bento grid. Block size represents cognitive footprint. Capacity is strictly constrained so you immediately see when your day is overloaded.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-text font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-violet" />
                    <span>Space Over Infinite Lists</span>
                  </div>
                  <p className="text-xs m-0 text-muted">
                    Glance at your board and instantly gauge total cognitive load without scrolling endless lines of checkboxes.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-text font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-teal" />
                    <span>Active Topology Modes</span>
                  </div>
                  <p className="text-xs m-0 text-muted">
                    Shift between <strong>All Blocks</strong>, <strong>Solo Focus</strong>, <strong>Urgent First</strong>, and <strong>Admin Sweep</strong> to reshape the grid for your current energy.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-dim/30 border border-amber/30 text-xs text-muted flex items-start gap-2.5">
                <Flame size={16} className="text-amber shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text block mb-0.5">The Capacity Ceiling</strong>
                  When your grid reaches 100% capacity, you must finish, resize, or archive existing blocks before adding more. Stray thoughts can be parked off-grid in the bottom-right <strong>Inbox</strong>.
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: BENTO BLOCKS ─── */}
          {activeTab === 'blocks' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                Anatomy of Spatial Block Formats
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    size: '1×1 Micro Admin',
                    badge: '1 Cell',
                    color: 'text-teal border-teal/30 bg-teal-dim',
                    icon: '⚡',
                    desc: 'Instant tap-to-complete button. The checkbox is the primary action — designed for rapid administrative hits.',
                  },
                  {
                    size: '2×1 Checklist Strip',
                    badge: '2 Cells',
                    color: 'text-amber border-amber/30 bg-amber-dim',
                    icon: '☰',
                    desc: 'Horizontal checklist card. Add subtasks, track progress with dynamic done/total counters.',
                  },
                  {
                    size: '2×2 Focus Hub',
                    badge: '4 Cells',
                    color: 'text-violet border-violet/30 bg-violet-dim',
                    icon: '◈',
                    desc: 'Tabbed powerhouse: seamlessly toggle between Markdown scratchpad notes, checklist, and focus timers.',
                  },
                  {
                    size: '3×2 Deep Matrix',
                    badge: '6 Cells',
                    color: 'text-violet border-violet/40 bg-violet/20 font-bold',
                    icon: '⊞',
                    desc: 'Split-pane master block: scratchpad on the left, checklist on the right, integrated live timer on bottom.',
                  },
                ].map((b) => (
                  <div key={b.size} className="p-3.5 rounded-2xl bg-elevated/50 border border-line flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-text flex items-center gap-1.5">
                        <span>{b.icon}</span> {b.size}
                      </span>
                      <span className={`text-[0.65rem] font-mono font-bold px-2 py-0.5 rounded-md border ${b.color}`}>
                        {b.badge}
                      </span>
                    </div>
                    <p className="text-xs m-0 text-muted leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line/80 text-xs flex items-center justify-between gap-3">
                <span className="text-text font-medium">💡 Dynamic Corner Resize</span>
                <span className="text-faint text-[0.72rem] font-mono">
                  Drag the bottom-right corner handle of any tile to fluidly expand or shrink its footprint
                </span>
              </div>
            </div>
          )}

          {/* ─── TAB 3: WORKFLOWS ─── */}
          {activeTab === 'workflows' && (
            <div className="flex flex-col gap-3.5">
              {[
                {
                  title: 'Inbox (Holding Pen)',
                  tag: 'Bottom-Right Dock',
                  icon: <Inbox size={15} className="text-teal" />,
                  desc: 'A floating quick-capture dock. Capture interruptions and stray thoughts without consuming grid capacity. Promote anytime by dragging onto the canvas or clicking ↗.',
                },
                {
                  title: 'The Ember Pomodoro Timer',
                  tag: 'Bottom-Left Widget',
                  icon: <Flame size={15} className="text-amber" />,
                  desc: 'A floating focus orb. Runs attached to active task timers with 25m Focus / 5m Breath / 15m Tide rhythms, or runs in standalone mode.',
                },
                {
                  title: 'End-of-Day Defrag Consolidation',
                  tag: 'Workspace Bloom',
                  icon: <RotateCcw size={15} className="text-teal" />,
                  desc: 'A satisfying cleaning ritual: sweeps all completed blocks off the board, records analytics, and compacts the grid for tomorrow.',
                },
                {
                  title: 'Rhythm Recurring Schedules',
                  tag: 'Header Menu',
                  icon: <Clock size={15} className="text-violet" />,
                  desc: 'Store daily, weekly, or monthly recurring routines off-grid. They wake up and surface when their scheduled time arrives.',
                },
              ].map((w) => (
                <div key={w.title} className="p-3.5 rounded-2xl bg-elevated/50 border border-line flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-text flex items-center gap-2">
                      {w.icon} {w.title}
                    </span>
                    <span className="text-[0.68rem] font-mono text-faint bg-elevated px-2 py-0.5 rounded-md border border-line">
                      {w.tag}
                    </span>
                  </div>
                  <p className="text-xs m-0 text-muted leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB 4: KEYBOARD SHORTCUTS ─── */}
          {activeTab === 'shortcuts' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                Productivity Hotkeys
              </span>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { keys: ['F'], label: 'Focus Shutter (Full-Screen Focus)', note: 'Hover any task tile and press F' },
                  { keys: ['Esc'], label: 'Exit / Close Modal', note: 'Dismisses focus shutter, modals, and drawers' },
                  { keys: ['⌘', 'Z'], label: 'Undo Workspace Step', note: 'Reverts tile edits, moves, and deletions' },
                  { keys: ['⌘', '⇧', 'Z'], label: 'Redo Workspace Step', note: 'Steps forward in history stack' },
                  { keys: ['⌘', 'Enter'], label: 'Quick Submit / Save', note: 'Creates tasks and saves preference dialogs' },
                  { keys: ['Double Click'], label: 'Solo Focus Spotlight', note: 'In Solo Focus mode, sets active single task' },
                  { keys: ['Click Tag'], label: 'Tag Spotlight Filter', note: 'Highlights all blocks with matching hashtag' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-elevated/50 border border-line/70"
                  >
                    <div>
                      <span className="text-xs font-semibold text-text block">{s.label}</span>
                      <span className="text-[0.7rem] text-faint block">{s.note}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 rounded-lg bg-surface border border-line text-text font-mono text-[0.72rem] font-bold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-line/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              setTimeout(() => startOnboardingTour(), 100);
            }}
            className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-elevated hover:bg-elevated-hi border border-line text-text flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Rocket size={13} className="text-violet" />
            <span>Launch Interactive Tour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-text text-void hover:opacity-90 transition-transform active:scale-95 shadow-md cursor-pointer ml-auto"
          >
            Got it
          </button>
        </div>
      </GlowCard>
    </div>
  );
};
