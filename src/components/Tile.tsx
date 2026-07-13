import React, { useState, useEffect } from 'react';
import { useStore, type Task } from '../store';
import { TileContent } from './TileContent';

const TOTAL_CELLS = 24;

export const Tile: React.FC<{ task: Task }> = ({ task }) => {
  const { archiveTask, openShutter, setTileSize, tasks, mode, setFocusedTask, addToast, setIsHoveringTask } = useStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    // Remove the entering class after the animation finishes
    const t = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isHovered && !task.isPen) {
      setIsHoveringTask(true);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'f') {
          const active = document.activeElement;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
          openShutter(task.id);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        setIsHoveringTask(false);
      };
    }
  }, [isHovered, task.id, openShutter, task.isPen, setIsHoveringTask]);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    setTimeout(() => {
      archiveTask(task.id);
      addToast(`Archived "${task.title}"`, '✓');
    }, 480);
  };

  const handleResize = (e: React.MouseEvent, w: number, h: number) => {
    e.stopPropagation();
    const currentUsed = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.parked ? 1 : t.w * t.h), 0);
    const delta = (w * h) - (task.w * task.h);
    if (currentUsed + delta <= TOTAL_CELLS) {
      setTileSize(task.id, w, h);
    } else {
      addToast('Not enough room — free up space first', '⚠');
    }
  };

  const handleDoubleClick = () => {
    if (mode === 'deep') {
      setFocusedTask(task.id);
    }
  };

  const sizeOptions = [
    { w: 1, h: 1, label: '1×1' },
    { w: 2, h: 1, label: '2×1' },
    { w: 2, h: 2, label: '2×2' },
    { w: 3, h: 2, label: '3×2' }
  ];

  return (
    <div
      className={`tile cat-${task.isPen ? 'pen' : task.cat} ${task.parked ? 'parked' : ''} ${isCompleting ? 'completing' : ''} ${isEntering ? 'entering' : ''}`}
      style={{ gridColumn: `span ${task.w}`, gridRow: `span ${task.h}` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {task.isPen ? (
        <TileContent task={task} />
      ) : (
        <>
          <div className="tile-head">
            <p className="tile-title">{task.title}</p>
            <div className="tile-meta">
              <button className="icon-btn" title="Focus Shutter (F)" onClick={(e) => { e.stopPropagation(); openShutter(task.id); }}>⤢</button>
              <button className="icon-btn" title="Archive" onClick={handleArchive}>✕</button>
            </div>
          </div>
          <div className="tile-body">
            <TileContent task={task} />
          </div>
          <div className="tile-footer">
            {task.cat === 'focus' && <span className="cat-badge focus">DEEP WORK</span>}
            {task.cat === 'fire' && <span className="cat-badge fire">FIREFIGHT</span>}
            {task.cat === 'admin' && <span className="cat-badge admin">ADMIN</span>}
            <div className="resize-controls">
              {sizeOptions.map(opt => (
                <button
                  key={`${opt.w}x${opt.h}`}
                  className={task.w === opt.w && task.h === opt.h ? 'active' : ''}
                  onClick={(e) => handleResize(e, opt.w, opt.h)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
