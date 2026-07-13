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
        <div className={`shutter-hint ${isHoveringTask ? 'show' : ''}`}>
          hover a block, press <b>F</b> to enter Focus Shutter · <b>Esc</b> to exit
        </div>
        <div id="shutter-backdrop" className={shutterOpen ? 'show' : ''} onClick={closeShutter}>
          <div id="shutter-stage">
            <div id="shutter-card" onClick={e => e.stopPropagation()}></div>
          </div>
        </div>
      </>
    );
  }

  const proxyTask = { ...task, w: 3, h: 2 };

  return (
    <>
      <div className={`shutter-hint show`}>
        hover a block, press <b>F</b> to enter Focus Shutter · <b>Esc</b> to exit
      </div>
      <div id="shutter-backdrop" className="show" onClick={closeShutter}>
        <div id="shutter-stage">
          <div id="shutter-card" onClick={e => e.stopPropagation()}>
            <div className="tile-head" style={{ marginBottom: '10px' }}>
              <p className="tile-title" style={{ fontSize: '20px' }}>{task.title}</p>
              {task.cat === 'focus' && <span className="cat-badge focus">DEEP WORK</span>}
              {task.cat === 'fire' && <span className="cat-badge fire">FIREFIGHT</span>}
              {task.cat === 'admin' && <span className="cat-badge admin">ADMIN</span>}
            </div>
            <div className="tile-body" style={{ marginTop: '14px' }}>
              <TileContent task={proxyTask} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
