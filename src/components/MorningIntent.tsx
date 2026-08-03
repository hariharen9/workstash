import React, { useState, useEffect, useRef } from 'react';
import { useStore, todayKey } from '../store';

export const MorningIntent: React.FC = () => {
  const { tasks, mode, morningIntentDate, setMorningIntentShown, changeTopology, logActivity, addToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'review' | 'done'>('greeting');
  const containerRef = useRef<HTMLDivElement>(null);

  const today = todayKey();

  useEffect(() => {
    if (morningIntentDate !== today) {
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [morningIntentDate, today]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentStep === 'review') {
          dismiss();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, currentStep]);

  const parkedTasks = tasks.filter(t => t.parked && !t.completed && !t.isPen);
  const activeTasks = tasks.filter(t => !t.completed && !t.isPen && !t.parked);
  const completedCount = tasks.filter(t => t.completed).length;

  const dismiss = () => {
    setIsOpen(false);
    setMorningIntentShown();
    setCurrentStep('greeting');
  };

  const goToReview = () => {
    setCurrentStep('review');
  };

  const finish = () => {
    logActivity(`Morning intent — ${parkedTasks.length} parked, ${activeTasks.length} active`, 'system');
    dismiss();
    if (mode !== 'normal') {
      changeTopology('normal');
      addToast('Board reset to All Blocks for a fresh day', '☀');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-[#05070C]/78 backdrop-blur-[12px] transition-opacity duration-300"
        onClick={currentStep === 'review' ? dismiss : undefined}
      />
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-5 pointer-events-none">
        {currentStep === 'greeting' && (
          <div
            ref={containerRef}
            className="w-full max-w-[480px] bg-elevated-hi border border-line rounded-[24px] p-8 flex flex-col items-center gap-5 shadow-shutter pointer-events-auto animate-toastIn"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-dim/30 flex items-center justify-center text-2xl">
              ☀
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] m-0 text-text text-center">
              Good morning
            </h2>
            <p className="text-muted text-[0.9rem] leading-relaxed text-center m-0 max-w-[340px]">
              A fresh day ahead. Let's get oriented — what's on your plate?
            </p>
            <div className="flex gap-3 mt-2 w-full">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-elevated border border-line text-muted font-semibold text-[0.875rem] cursor-pointer hover:text-text transition-colors"
                onClick={dismiss}
              >
                Later
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-text text-void font-semibold text-[0.875rem] cursor-pointer hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.15)] transition-all border-none"
                onClick={goToReview}
              >
                Let's look
              </button>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div
            ref={containerRef}
            className="w-full max-w-[520px] bg-elevated-hi border border-line rounded-[24px] p-8 flex flex-col gap-5 shadow-shutter pointer-events-auto animate-toastIn max-h-[80vh] overflow-y-auto"
            data-lenis-prevent="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] m-0 text-text">
                Today's landscape
              </h2>
              <button
                type="button"
                className="tile-action !w-8 !h-8"
                onClick={dismiss}
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {completedCount > 0 && (
              <div className="bg-teal-dim/20 border border-teal/20 rounded-xl px-4 py-3 text-[0.8125rem] text-teal font-medium text-center">
                {completedCount} completed {completedCount === 1 ? 'block' : 'blocks'} from last session — ready for defrag
              </div>
            )}

            {activeTasks.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[0.7rem] font-semibold tracking-[0.06em] text-muted uppercase">
                  Active blocks · {activeTasks.length}
                </span>
                <div className="flex flex-col gap-1.5">
                  {activeTasks.map(t => {
                    const catColor =
                      t.cat === 'focus' ? 'bg-violet-dim text-violet' :
                      t.cat === 'fire' ? 'bg-amber-dim text-amber' :
                      'bg-teal-dim text-teal';
                    const catLabel =
                      t.cat === 'focus' ? 'Focus' :
                      t.cat === 'fire' ? 'Urgent' :
                      'Admin';
                    return (
                      <div key={t.id} className="flex items-center gap-3 bg-elevated/60 rounded-xl px-3 py-2.5 border border-line/50">
                        <span className={`font-mono text-[0.6rem] font-semibold tracking-[0.04em] uppercase px-1.5 py-0.5 rounded-md shrink-0 ${catColor}`}>{catLabel}</span>
                        <span className="flex-1 min-w-0 text-[0.8125rem] font-medium text-text truncate">{t.title}</span>
                        <span className="text-[0.68rem] text-muted font-mono shrink-0">{t.w}×{t.h}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {parkedTasks.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[0.7rem] font-semibold tracking-[0.06em] text-muted uppercase">
                  Parked from previous mode · {parkedTasks.length}
                </span>
                <p className="text-[0.78rem] text-muted leading-snug">
                  These were tucked away by Urgent First or Admin Sweep. Worth reinstating?
                </p>
                <div className="flex flex-col gap-1.5">
                  {parkedTasks.map(t => {
                    const catColor =
                      t.cat === 'focus' ? 'bg-violet-dim text-violet' :
                      t.cat === 'fire' ? 'bg-amber-dim text-amber' :
                      'bg-teal-dim text-teal';
                    const catLabel =
                      t.cat === 'focus' ? 'Focus' :
                      t.cat === 'fire' ? 'Urgent' :
                      'Admin';
                    return (
                      <div key={t.id} className="flex items-center gap-3 bg-elevated/60 rounded-xl px-3 py-2.5 border border-line/50 opacity-70">
                        <span className={`font-mono text-[0.6rem] font-semibold tracking-[0.04em] uppercase px-1.5 py-0.5 rounded-md shrink-0 ${catColor}`}>{catLabel}</span>
                        <span className="flex-1 min-w-0 text-[0.8125rem] font-medium text-text truncate">{t.title}</span>
                        <span className="text-[0.68rem] text-muted font-mono shrink-0">{t.w}×{t.h}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTasks.length === 0 && parkedTasks.length === 0 && (
              <div className="text-muted text-center py-6 font-mono text-sm">
                Clean slate — add your first task
              </div>
            )}

            <button
              type="button"
              className="mt-2 w-full py-3 rounded-xl bg-text text-void font-semibold text-[0.875rem] cursor-pointer hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.15)] transition-all border-none"
              onClick={finish}
            >
              Got it — start the day
            </button>
          </div>
        )}
      </div>
    </>
  );
};
