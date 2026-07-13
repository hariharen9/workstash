import React, { useEffect } from 'react';
import { useStore } from '../store';
import { TileContent } from './TileContent';

export const FocusShutter: React.FC = () => {
  const { shutterOpen, closeShutter, tasks, isHoveringTask } = useStore();

  const task = tasks.find(t => t.id === shutterOpen);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shutterOpen) {
        closeShutter();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [shutterOpen, closeShutter]);

  if (!task) {
    return (
      <>
        <div className={`fixed bottom-[26px] left-1/2 -translate-x-1/2 z-[42] font-mono text-[11px] text-muted bg-surface border border-line p-[8px_16px] rounded-[20px] opacity-0 transition-opacity duration-300 pointer-events-none ${isHoveringTask ? 'opacity-100' : ''}`}>
          hover a block, press <b>F</b> to enter Focus Shutter · <b>Esc</b> to exit
        </div>
        <div className={`fixed inset-0 bg-[#05070C]/72 backdrop-blur-[14px] opacity-0 pointer-events-none transition-opacity duration-400 ease-out z-40 ${shutterOpen ? 'opacity-100 pointer-events-auto' : ''}`} onClick={closeShutter}>
          <div className="fixed inset-0 z-[41] flex items-center justify-center p-[5vh_8vw] pointer-events-none">
            <div className={`w-full max-w-[820px] h-[78vh] bg-surface border border-line rounded-[22px] p-[30px_34px] flex flex-col scale-[0.9] opacity-0 transition-[transform,opacity] duration-450 ease-custom-shutter shadow-shutter pointer-events-none ${shutterOpen ? 'scale-100 opacity-100 pointer-events-auto' : ''}`} onClick={e => e.stopPropagation()}></div>
          </div>
        </div>
      </>
    );
  }

  const proxyTask = { ...task, w: 3, h: 2 };

  return (
    <>
      <div className="fixed bottom-[26px] left-1/2 -translate-x-1/2 z-[42] font-mono text-[11px] text-muted bg-surface border border-line p-[8px_16px] rounded-[20px] transition-opacity duration-300 pointer-events-none opacity-100">
        hover a block, press <b>F</b> to enter Focus Shutter · <b>Esc</b> to exit
      </div>
      <div className="fixed inset-0 bg-[#05070C]/72 backdrop-blur-[14px] transition-opacity duration-400 ease-out z-40 opacity-100 pointer-events-auto" onClick={closeShutter}>
        <div className="fixed inset-0 z-[41] flex items-center justify-center p-[5vh_8vw] pointer-events-none">
          <div className="w-full max-w-[820px] h-[78vh] bg-surface border border-line rounded-[22px] p-[30px_34px] flex flex-col transition-[transform,opacity] duration-450 ease-custom-shutter shadow-shutter scale-100 opacity-100 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <p className="font-display font-semibold text-xl leading-1.3 tracking-[-0.01em] m-0 break-words">{task.title}</p>
              {task.cat === 'focus' && <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-violet-dim text-violet">DEEP WORK</span>}
              {task.cat === 'fire' && <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-amber-dim text-amber">FIREFIGHT</span>}
              {task.cat === 'admin' && <span className="text-[9px] font-mono p-[2px_6px] rounded-[5px] tracking-[0.03em] bg-teal-dim text-teal">ADMIN</span>}
            </div>
            <div className="flex-1 min-h-0 mt-3.5 flex flex-col">
              <TileContent task={proxyTask} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
