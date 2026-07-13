import React from 'react';
import { useStore } from '../store';
import { Tile } from './Tile';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

export const BentoGrid: React.FC<{ onNewTask: () => void }> = ({ onNewTask }) => {
  const { tasks, gridLayout, reorderTasks } = useStore();
  
  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;

  const occupiedCells = tasks.reduce((sum, t) => {
    if (t.completed) return sum;
    return sum + (t.parked ? 1 : t.w * t.h);
  }, 0);
  
  const isFull = occupiedCells >= TOTAL_CELLS;
  const unarchivedTasks = tasks.filter(t => !t.completed);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  return (
    <div className="flex-1 p-[18px_22px_22px] flex flex-col min-h-0 relative">
      <div className={`hidden items-center gap-2 text-[11.5px] text-amber font-mono mb-2 p-[8px_12px] bg-amber-dim border border-[#F5A62333] rounded-[9px] ${isFull ? '!flex' : ''}`}>
        ⚠ Grid at capacity — resize, complete, or archive a block before adding more.
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={unarchivedTasks.map(t => t.id)} strategy={rectSortingStrategy}>
          <div className={`flex-1 grid min-h-0 grid-flow-dense gap-3 ${
            gridLayout === '8x4' ? 'grid-cols-8 grid-rows-4' : 
            gridLayout === '6x5' ? 'grid-cols-6 grid-rows-5' : 
            'grid-cols-6 grid-rows-4'
          }`}>
            {unarchivedTasks.map(t => (
              <Tile key={t.id} task={t} />
            ))}
            <div className="col-span-1 row-span-1 rounded-radius border-[1.5px] border-dashed border-line flex items-center justify-center cursor-pointer text-faint transition-all duration-200 text-[22px] font-light hover:border-faint hover:text-muted hover:bg-surface" title="Add a block" onClick={onNewTask}>+</div>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
