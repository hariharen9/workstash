import React, { useState } from 'react';
import { useStore, occupiedCells } from '../store';
import { Tile } from './Tile';
import { HoldingPenDock } from './HoldingPenDock';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { TileContent } from './TileContent';

export const BentoGrid: React.FC<{ onNewTask: () => void }> = ({ onNewTask }) => {
  const { tasks, gridLayout, reorderTasks } = useStore();

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);
  const isFull = used >= TOTAL_CELLS;
  const gridTasks = tasks.filter(t => !t.completed && !t.isPen);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId]     = useState<string | null>(null);

  const activeTask = activeId ? gridTasks.find(t => t.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require 8px movement AND at least 120ms hold — prevents accidental drags on clicks/text-select
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? (event.over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="flex-1 p-[18px_22px_10px] flex flex-col min-h-0">
        <div className={`hidden items-center gap-2.5 text-[0.8125rem] text-amber font-medium mb-3 p-3 bg-amber-dim border border-amber/25 rounded-xl ${isFull ? '!flex' : ''}`}>
          <span className="font-mono text-[0.7rem] tracking-wide uppercase">Full</span>
          Grid at capacity — resize, complete, or archive a block before adding more.
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={gridTasks.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className={`flex-1 grid min-h-0 grid-flow-dense gap-3.5 ${
              gridLayout === '8x4' ? 'grid-cols-8 grid-rows-4' :
              gridLayout === '6x5' ? 'grid-cols-6 grid-rows-5' :
              'grid-cols-6 grid-rows-4'
            }`}>
              {gridTasks.map(t => (
                <Tile
                  key={t.id}
                  task={t}
                  isBeingDragged={t.id === activeId}
                  isDragTarget={t.id === overId && t.id !== activeId}
                />
              ))}
              {!isFull && (
                <button
                  type="button"
                  className="col-span-1 row-span-1 rounded-radius border border-dashed border-line flex flex-col items-center justify-center gap-1 cursor-pointer text-faint transition-all duration-200 hover:border-faint hover:text-muted hover:bg-surface/60"
                  title="Add a block"
                  onClick={onNewTask}
                >
                  <span className="text-[1.5rem] font-light leading-none">+</span>
                  <span className="text-[0.7rem] font-medium tracking-wide">Add</span>
                </button>
              )}
            </div>
          </SortableContext>

          {/* DragOverlay: floating clone that follows the cursor smoothly */}
          <DragOverlay
            dropAnimation={{
              duration: 220,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activeTask ? (
              <div
                className={`bg-surface shadow-2xl ring-2 ring-violet/50 rounded-radius flex flex-col overflow-hidden ${
                  activeTask.w >= 3 && activeTask.h >= 2 ? 'p-4' :
                  activeTask.w === 1 && activeTask.h === 1 ? 'p-3' : 'p-3.5'
                }`}
                style={{
                  gridColumn: `span ${activeTask.w}`,
                  gridRow: `span ${activeTask.h}`,
                  width: '100%',
                  height: '100%',
                  opacity: 0.97,
                  transform: 'scale(1.035) rotate(-0.6deg)',
                  boxShadow: '0 28px 60px rgba(0,0,0,0.65), 0 0 0 2px rgba(139,92,246,0.45)',
                  backdropFilter: 'blur(4px)',
                  cursor: 'grabbing',
                }}
              >
                <p className="font-display font-semibold text-[0.95rem] leading-snug tracking-[-0.02em] m-0 break-words text-text mb-2">
                  {activeTask.title}
                </p>
                <div className="flex-1 min-h-0 opacity-60">
                  <TileContent task={activeTask} disableTick />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <HoldingPenDock />
    </div>
  );
};
