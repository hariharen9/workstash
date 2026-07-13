import React from 'react';
import { useStore } from '../store';
import { Tile } from './Tile';

const TOTAL_CELLS = 24;

export const BentoGrid: React.FC<{ onNewTask: () => void }> = ({ onNewTask }) => {
  const { tasks } = useStore();
  const unarchivedTasks = tasks.filter(t => !t.completed);
  
  const occupiedCells = unarchivedTasks.reduce((sum, t) => sum + (t.parked ? 1 : t.w * t.h), 0);
  const isFull = occupiedCells >= TOTAL_CELLS;

  return (
    <div className="grid-stage">
      <div className={`grid-full-msg ${isFull ? 'show' : ''}`}>
        ⚠ Grid at capacity — resize, complete, or archive a block before adding more.
      </div>
      <div id="grid">
        {unarchivedTasks.map(t => (
          <Tile key={t.id} task={t} />
        ))}
        <div className="add-tile" title="Add a block" onClick={onNewTask}>+</div>
      </div>
    </div>
  );
};
