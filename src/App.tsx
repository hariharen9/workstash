import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Sparkles, Clock, ArrowUpRight, RotateCcw, Package } from 'lucide-react';
import { Header } from './components/Header';
import { BentoGrid } from './components/BentoGrid';
import { FocusShutter } from './components/FocusShutter';
import { NewTaskModal } from './components/NewTaskModal';
import { DefragOverlay } from './components/DefragOverlay';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { ArchiveModal } from './components/ArchiveModal';
import { ActiveTimerWidget } from './components/ActiveTimerWidget';
import { CommandPalette } from './components/CommandPalette';
import { RhythmModal } from './components/RhythmModal';
import { HoldingPenDock } from './components/HoldingPenDock';
import { OnboardingTour } from './components/OnboardingTour';
import { Footer } from './components/Footer';
import { PrivacyModal } from './components/PrivacyModal';
import { useStore } from './store';
import { useAuth } from './auth';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDefragging, setIsDefragging] = useState(false);
  const [isRhythmOpen, setIsRhythmOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const { undo, redo, undoStack, redoStack } = useStore();
  const { syncStatus, syncError, retrySync } = useAuth();

  // Undo/redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        useStore.getState().addToast(`Undone — ${undoStack.length - 1} step${undoStack.length - 1 !== 1 ? 's' : ''} remaining`, '↩');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
        useStore.getState().addToast(`Redone — ${redoStack.length} step${redoStack.length !== 1 ? 's' : ''} ahead`, '↪');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, undoStack.length, redoStack.length]);

  // Request notification permission on first interaction
  useEffect(() => {
    const request = () => {
      useStore.getState().requestNotificationPermission();
    };
    const handleInteraction = () => {
      request();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      window.addEventListener('click', handleInteraction);
      window.addEventListener('keydown', handleInteraction);
    }
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const handleDefragComplete = () => {
    setIsDefragging(false);
  };

  return (
    <>
      {syncStatus === 'error' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 bg-danger/10 border border-danger/40 backdrop-blur-sm px-4 py-3 rounded-xl shadow-toast max-w-md w-[calc(100%-2rem)]">
          <span className="text-danger text-lg leading-none">⚠</span>
          <div className="flex-1 min-w-0">
            <div className="text-text text-[0.8rem] font-semibold">Sync problem</div>
            <div className="text-muted text-[0.72rem] leading-snug">{syncError}</div>
          </div>
          <button
            type="button"
            onClick={() => void retrySync()}
            className="shrink-0 text-[0.75rem] font-semibold text-text bg-danger/20 hover:bg-danger/30 border border-danger/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      <section className="min-h-screen md:h-screen w-full flex flex-col shrink-0 relative z-10 bg-void">
        <Header
          onNewTask={() => setIsModalOpen(true)}
          onDefrag={() => setIsDefragging(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenArchive={() => setIsArchiveOpen(true)}
          onOpenRhythm={() => setIsRhythmOpen(true)}
        />
        <BentoGrid onNewTask={() => setIsModalOpen(true)} />
      </section>

      <AnalyticsDashboard />

      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <FocusShutter />

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />

      <RhythmModal
        isOpen={isRhythmOpen}
        onClose={() => setIsRhythmOpen(false)}
        onNewTask={() => {
          setIsRhythmOpen(false);
          setIsModalOpen(true);
        }}
      />

      <DefragOverlay
        isDefragging={isDefragging}
        onComplete={handleDefragComplete}
      />

      <ActiveTimerWidget />
      <HoldingPenDock />

      <CommandPalette />
      <OnboardingTour />

      <ToastContainer />
    </>
  );
}

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();
  
  return (
    <div className="fixed bottom-6 sm:bottom-8 right-4 sm:right-6 z-[999] flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: { id: string; msg: string; icon: string }; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => onRemove(), 180);
    }, 2200);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(), 180);
  };

  const getBadgeMeta = (icon: string) => {
    if (icon === '⚠' || icon === '✕' || icon === '!') {
      return {
        iconComponent: <AlertTriangle size={14} />,
        bg: 'bg-amber-dim text-amber border-amber/30',
        ring: 'shadow-[0_0_12px_rgba(245,166,35,0.2)]',
      };
    }
    if (icon === '✓' || icon === '✔') {
      return {
        iconComponent: <CheckCircle2 size={14} />,
        bg: 'bg-teal-dim text-teal border-teal/30',
        ring: 'shadow-[0_0_12px_rgba(94,234,212,0.2)]',
      };
    }
    if (icon === '⟳' || icon === '↺' || icon === '↩') {
      return {
        iconComponent: <RotateCcw size={13} />,
        bg: 'bg-violet-dim text-violet border-violet/30',
        ring: 'shadow-[0_0_12px_rgba(139,124,246,0.2)]',
      };
    }
    if (icon === '⚡' || icon === '✨') {
      return {
        iconComponent: <Sparkles size={13} />,
        bg: 'bg-violet-dim text-violet border-violet/30',
        ring: 'shadow-[0_0_12px_rgba(139,124,246,0.2)]',
      };
    }
    if (icon === '⏰' || icon === '⏳' || icon === '⏱') {
      return {
        iconComponent: <Clock size={13} />,
        bg: 'bg-violet-dim text-violet border-violet/30',
        ring: 'shadow-[0_0_12px_rgba(139,124,246,0.2)]',
      };
    }
    if (icon === '📦') {
      return {
        iconComponent: <Package size={13} />,
        bg: 'bg-amber-dim text-amber border-amber/30',
        ring: 'shadow-[0_0_12px_rgba(245,166,35,0.2)]',
      };
    }
    if (icon === '↗') {
      return {
        iconComponent: <ArrowUpRight size={14} />,
        bg: 'bg-teal-dim text-teal border-teal/30',
        ring: 'shadow-[0_0_12px_rgba(94,234,212,0.2)]',
      };
    }
    return {
      iconComponent: <span className="text-[0.8rem]">{icon}</span>,
      bg: 'bg-elevated text-text border-line',
      ring: '',
    };
  };

  const badge = getBadgeMeta(toast.icon);

  return (
    <div 
      className={`group/toast relative overflow-hidden bg-surface/95 backdrop-blur-xl border border-line/80 dark:border-white/10 px-3.5 py-2.5 rounded-2xl text-[0.8125rem] font-medium max-w-[360px] min-w-[240px] shadow-[0_12px_32px_-6px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] flex items-center gap-3 transition-all duration-180 ease-out select-none animate-toastIn ${
        isRemoving ? 'opacity-0 translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      {/* Icon Badge */}
      <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${badge.bg} ${badge.ring}`}>
        {badge.iconComponent}
      </div>

      {/* Message */}
      <span className="leading-snug text-text font-medium flex-1 min-w-0 pr-1">
        {toast.msg}
      </span>

      {/* Quick Dismiss Button on hover */}
      <button
        type="button"
        onClick={handleDismiss}
        className="w-5 h-5 rounded-lg text-faint hover:text-text hover:bg-elevated flex items-center justify-center shrink-0 cursor-pointer transition-colors border-none p-0"
        title="Dismiss"
      >
        <X size={12} />
      </button>

      {/* Subtle bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet via-teal to-violet origin-left animate-[toastProgress_2.2s_linear_forwards] opacity-60 pointer-events-none" />
    </div>
  );
};

export default App;
