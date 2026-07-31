import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { TileContent } from './TileContent';

export const FocusShutter: React.FC = () => {
  const { shutterOpen, closeShutter, tasks, isHoveringTask, updateTitle } = useStore();

  const task = tasks.find(t => t.id === shutterOpen);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shutterOpen) {
        if (isEditingTitle) {
          setIsEditingTitle(false);
          return;
        }
        closeShutter();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [shutterOpen, closeShutter, isEditingTitle]);

  useEffect(() => {
    if (task) {
      setDraftTitle(task.title);
      setIsEditingTitle(false);
    }
  }, [task?.id, task?.title]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  const commitTitle = () => {
    if (!task) return;
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateTitle(task.id, trimmed);
    } else {
      setDraftTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  if (!task) {
    return (
      <>
        <div className={`fixed bottom-[26px] left-1/2 -translate-x-1/2 z-[42] text-[0.8125rem] text-muted bg-surface/95 border border-line px-4 py-2.5 rounded-full opacity-0 transition-opacity duration-300 pointer-events-none shadow-toast ${isHoveringTask ? 'opacity-100' : ''}`}>
          Hover a block, press <span className="text-text font-semibold">F</span> for Focus · <span className="text-text font-semibold">Esc</span> to exit
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
      <div className="fixed bottom-[26px] left-1/2 -translate-x-1/2 z-[42] text-[0.8125rem] text-muted bg-surface/95 border border-line px-4 py-2.5 rounded-full transition-opacity duration-300 pointer-events-none opacity-100 shadow-toast">
        Press <span className="text-text font-semibold">Esc</span> to exit Focus Shutter
      </div>
      <div className="fixed inset-0 bg-[#05070C]/75 backdrop-blur-[16px] transition-opacity duration-400 ease-out z-40 opacity-100 pointer-events-auto" onClick={closeShutter}>
        <div className="fixed inset-0 z-[41] flex items-center justify-center p-[5vh_8vw] pointer-events-none">
          <div className="w-full max-w-[860px] h-[78vh] bg-surface border border-line rounded-[24px] p-8 flex flex-col transition-[transform,opacity] duration-450 ease-custom-shutter shadow-shutter scale-100 opacity-100 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-1">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  className="font-display font-semibold text-[1.6rem] leading-tight tracking-[-0.03em] m-0 flex-1 min-w-0 bg-elevated border border-line rounded-xl px-3 py-2 text-text outline-none focus:border-faint"
                  value={draftTitle}
                  maxLength={80}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTitle();
                    if (e.key === 'Escape') {
                      setDraftTitle(task.title);
                      setIsEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <p
                  className="font-display font-semibold text-[1.6rem] leading-tight tracking-[-0.03em] m-0 break-words cursor-text hover:text-violet transition-colors"
                  title="Click to rename"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {task.title}
                </p>
              )}
              {task.cat === 'focus' && <span className="font-mono text-[0.6875rem] font-semibold px-2.5 py-1 rounded-md tracking-[0.04em] uppercase bg-violet-dim text-violet shrink-0">Deep Focus</span>}
              {task.cat === 'fire' && <span className="font-mono text-[0.6875rem] font-semibold px-2.5 py-1 rounded-md tracking-[0.04em] uppercase bg-amber-dim text-amber shrink-0">Urgent</span>}
              {task.cat === 'admin' && <span className="font-mono text-[0.6875rem] font-semibold px-2.5 py-1 rounded-md tracking-[0.04em] uppercase bg-teal-dim text-teal shrink-0">Quick Admin</span>}
            </div>
            <div className="flex-1 min-h-0 mt-5 flex flex-col">
              <TileContent task={proxyTask} disableTick />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
