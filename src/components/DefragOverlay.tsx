import React, { useEffect, useState, useRef } from 'react';
import { useStore, type Task } from '../store';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { GlowCard } from './GlowCard';

export const DefragOverlay: React.FC<{
  isDefragging: boolean;
  onComplete: () => void;
}> = ({ isDefragging, onComplete }) => {
  const { tasks, runDefrag } = useStore();
  const [subText, setSubText] = useState('');
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [highlightCompleted, setHighlightCompleted] = useState(false);
  const [parent] = useAutoAnimate<HTMLDivElement>({ duration: 400, easing: 'ease-out' });

  // Use refs to hold stable references to these values so they don't re-trigger the animation sequence
  const tasksRef = useRef(tasks);
  const runDefragRef = useRef(runDefrag);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    tasksRef.current = tasks;
    runDefragRef.current = runDefrag;
    onCompleteRef.current = onComplete;
  }, [tasks, runDefrag, onComplete]);

  useEffect(() => {
    if (isDefragging) {
      // Snapshot the current tasks
      const currentTasks = tasksRef.current;
      setLocalTasks([...currentTasks]);
      setHighlightCompleted(false);
      
      const completedCount = currentTasks.filter(t => t.completed).length;
      setSubText('analyzing sectors...');

      const t1 = setTimeout(() => {
        setSubText(completedCount ? `identified ${completedCount} completed block${completedCount > 1 ? 's' : ''}` : 'no completed blocks to clear');
        setHighlightCompleted(true);
      }, 800);
      
      const t2 = setTimeout(() => {
        setSubText('clearing blocks and compacting grid...');
        // Remove completed, auto-animate will handle the visual sliding
        setLocalTasks(prev => prev.filter(t => !t.completed));
      }, 1800);
      
      const t3 = setTimeout(() => {
        runDefragRef.current();
        setSubText('defragmentation complete');
      }, 2800);

      const t4 = setTimeout(() => {
        useStore.getState().addToast(`Defrag complete — ${completedCount} archived`, '⟳');
        onCompleteRef.current();
      }, 3400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isDefragging]); // ONLY trigger on isDefragging change!

  return (
    <div className={`fixed inset-0 z-[55] bg-void hidden flex-col items-center justify-center gap-8 ${isDefragging ? '!flex' : ''}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="font-display text-[22px] font-semibold text-text">Defragmenting workspace…</div>
        <div className="text-muted text-[13px] font-mono tracking-wide">{subText}</div>
      </div>
      
      {/* Micro Grid Visualization */}
      <GlowCard 
        customSize 
        glowColor="blue"
        ref={parent} 
        className="grid grid-cols-6 grid-rows-4 grid-flow-dense gap-2 p-3 bg-surface rounded-xl w-[400px] h-[280px]"
      >
        {localTasks.map(t => {
          const isRemoving = highlightCompleted && t.completed;
          const bgClass = t.isPen ? 'bg-elevated border-dashed' : 
                          t.cat === 'focus' ? 'bg-violet border-transparent' : 
                          t.cat === 'fire' ? 'bg-amber border-transparent' : 
                          t.cat === 'admin' ? 'bg-teal border-transparent' : 'bg-elevated border-transparent';
          
          return (
            <div 
              key={t.id}
              className={`rounded-[6px] border opacity-80 shadow-sm transition-all duration-300 ${bgClass} ${isRemoving ? 'opacity-30 scale-90 saturate-200 ring-2 ring-white/50' : ''} ${t.parked ? 'opacity-20' : ''}`}
              style={{ gridColumn: `span ${t.w}`, gridRow: `span ${t.h}` }}
            />
          );
        })}
      </GlowCard>
    </div>
  );
};
