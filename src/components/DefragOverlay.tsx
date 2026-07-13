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
    <div className={`fixed inset-0 z-[55] bg-void hidden items-center justify-center flex-col gap-[18px] ${isDefragging ? '!flex' : ''}`}>
      <div className="font-display text-[22px] font-semibold">Defragmenting workspace…</div>
      <div className="text-muted text-[13px] font-mono">{subText}</div>
      <div className="w-[280px] h-1 bg-elevated rounded-[3px] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet to-teal transition-[width] duration-[1400ms] ease-custom-defrag" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};
