import React, { useState, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
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
import { MorningIntent } from './components/MorningIntent';
import { useStore } from './store';
import { useAuth } from './auth';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isDefragging, setIsDefragging] = useState(false);
  const { undo, redo, undoStack, redoStack } = useStore();
  const { syncStatus, syncError, retrySync } = useAuth();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t), // expo out — fast start, soft stop
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

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
      <section className="h-screen w-full flex flex-col shrink-0 relative z-10 bg-void">
        <Header
          onNewTask={() => setIsModalOpen(true)}
          onDefrag={() => setIsDefragging(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenArchive={() => setIsArchiveOpen(true)}
        />
        <BentoGrid onNewTask={() => setIsModalOpen(true)} />
      </section>

      <AnalyticsDashboard />

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

      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />

      <DefragOverlay
        isDefragging={isDefragging}
        onComplete={handleDefragComplete}
      />

      <ActiveTimerWidget />

      <CommandPalette />
      <MorningIntent />

      <ToastContainer />
    </>
  );
}

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();
  
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: { id: string, msg: string, icon: string }, onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isRemoving, setIsRemoving] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => onRemove(), 400); // Wait for transition
    }, 3200);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <div 
      className={`bg-elevated-hi/95 border border-line px-4 py-3 rounded-xl text-[0.8125rem] font-medium max-w-[340px] animate-toastIn shadow-toast flex items-center gap-2.5 backdrop-blur-sm ${
        isRemoving ? 'opacity-0 translate-y-2 transition-[opacity,transform] duration-400' : ''
      }`}
    >
      <span className="text-[0.9rem] shrink-0">{toast.icon}</span>
      <span className="leading-snug text-text">{toast.msg}</span>
    </div>
  );
};

export default App;
