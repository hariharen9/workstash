import React from 'react';
import { useStore, occupiedCells } from '../store';
import { Tile } from './Tile';
import { HoldingPenDock } from './HoldingPenDock';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

export const BentoGrid: React.FC<{ onNewTask: () => void }> = ({ onNewTask }) => {
  const { tasks, gridLayout, reorderTasks } = useStore();

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);
  const isFull = used >= TOTAL_CELLS;
  const gridTasks = tasks.filter(t => !t.completed && !t.isPen);

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
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="flex-1 p-[18px_22px_10px] flex flex-col min-h-0">
        <div className={`hidden items-center gap-2.5 text-[0.8125rem] text-amber font-medium mb-3 p-3 bg-amber-dim border border-amber/25 rounded-xl ${isFull ? '!flex' : ''}`}>
          <span className="font-mono text-[0.7rem] tracking-wide uppercase">Full</span>
          Grid at capacity — resize, complete, or archive a block before adding more.
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={gridTasks.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className={`flex-1 grid min-h-0 grid-flow-dense gap-3.5 ${
              gridLayout === '8x4' ? 'grid-cols-8 grid-rows-4' :
              gridLayout === '6x5' ? 'grid-cols-6 grid-rows-5' :
              'grid-cols-6 grid-rows-4'
            }`}>
              {gridTasks.map(t => (
                <Tile key={t.id} task={t} />
              ))}
              <button
                type="button"
                className="col-span-1 row-span-1 rounded-radius border border-dashed border-line flex flex-col items-center justify-center gap-1 cursor-pointer text-faint transition-all duration-200 hover:border-faint hover:text-muted hover:bg-surface/60"
                title="Add a block"
                onClick={onNewTask}
              >
                <span className="text-[1.5rem] font-light leading-none">+</span>
                <span className="text-[0.7rem] font-medium tracking-wide">Add</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <HoldingPenDock />
    </div>
  );
};
