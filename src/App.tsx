import React, { useState, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { Header } from './components/Header';
import { BentoGrid } from './components/BentoGrid';
import { FocusShutter } from './components/FocusShutter';
import { NewTaskModal } from './components/NewTaskModal';
import { DefragOverlay } from './components/DefragOverlay';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './store';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDefragging, setIsDefragging] = useState(false);
  const { runDefrag } = useStore();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
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

  const handleDefragComplete = () => {
    setIsDefragging(false);
    runDefrag();
  };

  return (
    <>
      <section className="h-screen w-full flex flex-col snap-start shrink-0 relative z-10 bg-void">
        <Header 
          onNewTask={() => setIsModalOpen(true)} 
          onDefrag={() => setIsDefragging(true)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
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
      
      <DefragOverlay 
        isDefragging={isDefragging}
        onComplete={handleDefragComplete}
      />
      
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
      className={`bg-elevated-hi border border-line p-[12px_16px] rounded-[11px] text-[12.5px] max-w-[320px] animate-toastIn shadow-toast flex items-center gap-2.5 ${
        isRemoving ? 'opacity-0 translate-y-2 transition-[opacity,transform] duration-400' : ''
      }`}
    >
      <span>{toast.icon}</span>
      <span>{toast.msg}</span>
    </div>
  );
};

export default App;
