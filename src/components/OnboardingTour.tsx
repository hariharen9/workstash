import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { GlowCard } from './GlowCard';
import { playClick, playTagSpotlight, playDefrag } from '../sounds';
import {
  Sparkles,
  ArrowLeft,
  X,
  Layers,
  Flame,
  Inbox,
  Grid3X3,
  Rocket,
} from 'lucide-react';

interface TourStep {
  id: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  tagline: string;
  desc: string;
  targetSelector?: string;
  position: 'center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
  actionLabel: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    icon: <Rocket className="text-violet" size={20} />,
    badge: 'Spatial Paradigm',
    title: 'Your to-do list is lying to you.',
    tagline: 'Infinite vertical lists hide mental overload behind a scrollbar.',
    desc: 'Welcome to WorkStash. Here, tasks are physical blocks on a bounded 2D grid. Block size equals cognitive weight — if it doesn’t fit on the board, it doesn’t fit in your day.',
    position: 'center',
    actionLabel: 'Show me how it works →',
  },
  {
    id: 'capacity',
    icon: <Grid3X3 className="text-amber" size={20} />,
    badge: 'Finite Capacity',
    title: 'A hard limit on human overload.',
    tagline: 'The capacity gauge enforces healthy cognitive boundaries.',
    desc: 'Every block consumes grid cells. When full, you are locked from piling on more tasks until you finish, downsize, or defrag. Strict by design. Sanity-saving in practice.',
    targetSelector: 'header .group\\/cap',
    position: 'top-center',
    actionLabel: 'Next: Shape-shifting blocks →',
  },
  {
    id: 'blocks',
    icon: <Layers className="text-violet" size={20} />,
    badge: 'Bento Block Anatomy',
    title: 'From 1×1 micro-buttons to 3×2 command hubs.',
    tagline: 'Every task takes the exact shape it deserves.',
    desc: 'Use 1×1 buttons for rapid admin hits, 2×1 strips for checklists, 2×2 hubs for Markdown notes, and 3×2 matrices for split-pane deep work. Drag any bottom-right corner handle to resize live.',
    targetSelector: '[data-task-id]',
    position: 'top-center',
    actionLabel: 'What about distractions? →',
  },
  {
    id: 'inbox',
    icon: <Inbox className="text-teal" size={20} />,
    badge: 'Off-Grid Buffer',
    title: 'Caught an interruption? Park it here.',
    tagline: 'Distractions don’t deserve your precious grid capacity.',
    desc: 'Stash stray thoughts in the bottom-right Inbox dock. They stay safely off-grid without taking capacity. When you’re ready, drag them straight onto the canvas or tap ↗ to promote.',
    targetSelector: 'aside[aria-label="Inbox quick capture"]',
    position: 'bottom-right',
    actionLabel: 'Next: Focus Engine →',
  },
  {
    id: 'ember',
    icon: <Flame className="text-amber" size={20} />,
    badge: 'The Ember Pomodoro',
    title: 'Burn down your focus.',
    tagline: 'A floating focus coal anchored at the bottom-left.',
    desc: 'Launch a timer on any tile or tap The Ember to ignite a 25m Focus / 5m Tide session. It attaches automatically to whatever block you work on so you stay locked in.',
    targetSelector: '.pomo-root',
    position: 'bottom-left',
    actionLabel: 'One last superpower →',
  },
  {
    id: 'topologies',
    icon: <Sparkles className="text-violet" size={20} />,
    badge: 'Topology & Defrag',
    title: 'Morph the board to your current mood.',
    tagline: 'Shift perspectives and clean the board with one click.',
    desc: 'Switch to Solo Focus for tunnel vision, Urgent First for triage, or hover the Workspace Bloom menu to run your End-of-Day Defrag ritual. You are ready to build!',
    targetSelector: 'header',
    position: 'top-center',
    actionLabel: 'Launch My Workspace 🚀',
  },
];

export const OnboardingTour: React.FC = () => {
  const {
    onboardingTourActive,
    hasCompletedTour,
    completeOnboardingTour,
    dismissOnboardingTour,
    startOnboardingTour,
    soundsEnabled,
    theme,
  } = useStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Auto-launch tour on first visit after a brief grace period
  useEffect(() => {
    if (!hasCompletedTour && !onboardingTourActive) {
      const timer = setTimeout(() => {
        startOnboardingTour();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, onboardingTourActive, startOnboardingTour]);

  const currentStep = TOUR_STEPS[stepIndex];

  // Measure and track target DOM element
  const updateTargetRect = useCallback(() => {
    if (!onboardingTourActive || !currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }
    try {
      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } catch {
      setTargetRect(null);
    }
  }, [onboardingTourActive, currentStep]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect, stepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!onboardingTourActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissOnboardingTour();
        if (soundsEnabled) playClick();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onboardingTourActive, stepIndex, soundsEnabled]);

  if (!onboardingTourActive) return null;

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      if (soundsEnabled) playTagSpotlight();
    } else {
      completeOnboardingTour();
      if (soundsEnabled) playDefrag();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      if (soundsEnabled) playClick();
    }
  };

  const isFirst = stepIndex === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden pointer-events-auto"
      data-lenis-prevent="true"
    >
      {/* ─── True Crystal-Clear SVG Mask Cutout (Unblurred Target) ─── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto z-[100]"
        onClick={dismissOnboardingTour}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White = Dimmed Area */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black = 100% Transparent, Unblurred Cutout Window */}
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="20"
                ry="20"
                fill="black"
                className="transition-all duration-500 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop masked with the cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={theme === 'light' ? 'rgba(15, 23, 42, 0.65)' : 'rgba(7, 10, 16, 0.84)'}
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* ─── Glowing Neon Target Perimeter Ring ─── */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.2,0.9,0.3,1)] z-[101]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: '20px',
            border: '2px solid rgba(155, 140, 255, 0.9)',
            boxShadow: '0 0 25px rgba(155, 140, 255, 0.5), inset 0 0 15px rgba(155, 140, 255, 0.25)',
            animation: 'pulse 2.2s ease-in-out infinite',
          }}
        />
      )}

      {/* ─── Tour Modal Card ─── */}
      <div
        className="relative z-[102] w-full max-w-[520px] animate-tileIn"
        onClick={(e) => e.stopPropagation()}
      >
        <GlowCard
          customSize
          glowColor="purple"
          className="bg-surface/98 backdrop-blur-2xl border border-line rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4 text-text relative overflow-hidden"
        >
          {/* Top Bar: Step count & skip */}
          <div className="flex items-center justify-between pb-2 border-b border-line/70 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full bg-violet-dim text-violet border border-violet/30 tracking-wide uppercase">
                {currentStep.badge}
              </span>
              <span className="text-xs font-mono text-faint">
                {stepIndex + 1} of {TOUR_STEPS.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  dismissOnboardingTour();
                  if (soundsEnabled) playClick();
                }}
                className="text-[0.72rem] text-faint hover:text-text font-mono transition-colors cursor-pointer mr-1"
              >
                Skip Tour
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissOnboardingTour();
                  if (soundsEnabled) playClick();
                }}
                className="tile-action !w-7 !h-7 !rounded-lg"
                aria-label="Close tour"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Step Icon & Titles */}
          <div className="flex items-start gap-3.5 pt-1">
            <div className="w-10 h-10 rounded-2xl bg-elevated-hi border border-line flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              {currentStep.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-display font-semibold tracking-tight text-text leading-snug m-0">
                {currentStep.title}
              </h3>
              <p className="text-xs text-muted font-medium m-0 mt-1 leading-normal">
                {currentStep.tagline}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-2xl bg-elevated/50 border border-line/70 text-[0.82rem] text-muted leading-relaxed">
            {currentStep.desc}
          </div>

          {/* Step Progress Dots & Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-line/70 shrink-0 mt-1">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setStepIndex(i);
                    if (soundsEnabled) playClick();
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === stepIndex
                      ? 'w-6 bg-violet shadow-sm'
                      : i < stepIndex
                      ? 'w-2 bg-violet/40'
                      : 'w-2 bg-line hover:bg-faint'
                  }`}
                  aria-label={`Go to tour step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-elevated hover:bg-elevated-hi text-muted hover:text-text border border-line transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-text text-void hover:opacity-90 transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentStep.actionLabel}</span>
              </button>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
};
