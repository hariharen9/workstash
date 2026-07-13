import React, { useState } from 'react';
import { Header } from './components/Header';
import { BentoGrid } from './components/BentoGrid';
import { FocusShutter } from './components/FocusShutter';
import { NewTaskModal } from './components/NewTaskModal';
import { DefragOverlay } from './components/DefragOverlay';
import { useStore } from './store';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDefragging, setIsDefragging] = useState(false);

  return (
    <>
      <Header 
        onNewTask={() => setIsModalOpen(true)} 
        onDefrag={() => setIsDefragging(true)} 
      />
      <BentoGrid onNewTask={() => setIsModalOpen(true)} />

      <FocusShutter />
      
      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      <DefragOverlay 
        isDefragging={isDefragging}
        onComplete={() => setIsDefragging(false)}
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
