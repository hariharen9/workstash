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
    <div id="toast">
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
      className="toast-item" 
      style={isRemoving ? { opacity: 0, transform: 'translateY(8px)', transition: 'opacity .4s, transform .4s' } : {}}
    >
      <span>{toast.icon}</span>
      <span>{toast.msg}</span>
    </div>
  );
};

export default App;
