import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

export const DefragOverlay: React.FC<{
  isDefragging: boolean;
  onComplete: () => void;
}> = ({ isDefragging, onComplete }) => {
  const { tasks, runDefrag } = useStore();
  const [subText, setSubText] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isDefragging) {
      const completedCount = tasks.filter(t => t.completed).length;
      
      setProgress(0);
      setSubText(completedCount ? `clearing ${completedCount} completed block${completedCount > 1 ? 's' : ''}` : 'no completed blocks to clear');
      
      const t1 = setTimeout(() => setProgress(45), 50);
      const t2 = setTimeout(() => {
        setSubText('compacting unfinished layout for tomorrow');
        setProgress(80);
      }, 900);
      
      const t3 = setTimeout(() => {
        runDefrag();
        setProgress(100);
        setSubText('done');
      }, 1500);

      const t4 = setTimeout(() => {
        useStore.getState().addToast(`Defrag complete — ${completedCount} archived, workspace compacted`, '⟳');
        onComplete();
      }, 2100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isDefragging, tasks, runDefrag, onComplete]);

  return (
    <div id="defrag-overlay" className={isDefragging ? 'show' : ''}>
      <div className="defrag-title">Defragmenting workspace…</div>
      <div className="defrag-sub">{subText}</div>
      <div className="defrag-bar">
        <div className="defrag-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};
