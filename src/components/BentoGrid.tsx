import React, { useState } from 'react';
import { useStore, occupiedCells, type Task } from '../store';
import { Tile } from './Tile';
import { HoldingPenDock } from './HoldingPenDock';
import { playDrop } from '../sounds';
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
  type DropAnimation,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Clock, Battery, CheckCircle2, Sparkles, Flame } from 'lucide-react';

const customCollisionDetection: CollisionDetection = (args) => {
  // 1. Try pointerWithin (where user's cursor directly points)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // 2. Fall back to rectIntersection (bounding overlap)
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  // 3. Fall back to closestCenter
  return closestCenter(args);
};

const dropAnimationConfig: DropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.3',
      },
    },
  }),
};

const DragOverlayCard: React.FC<{ task: Task }> = ({ task }) => {
  const catColor =
    task.cat === 'focus' ? 'violet' :
    task.cat === 'fire' ? 'amber' : 'teal';

  const subtasksTotal = task.subtasks?.length || 0;
  const subtasksDone = task.subtasks?.filter(s => s.done).length || 0;

  // Approximate realistic card width based on cell width
  const cardWidth = task.w >= 3 ? 380 : task.w === 2 ? 290 : 210;
  const cardMinHeight = task.h >= 2 ? 160 : 100;

  return (
    <div
      className={`bg-surface/98 backdrop-blur-xl rounded-[18px] border p-4 shadow-[0_28px_60px_-10px_rgba(0,0,0,0.85),0_0_35px_rgba(155,140,255,0.4)] flex flex-col gap-2.5 cursor-grabbing select-none transition-transform pointer-events-none ring-1 ring-violet/40 ${
        catColor === 'violet'
          ? 'border-violet/60 shadow-[inset_3px_0_0_#9B8CFF]'
          : catColor === 'amber'
          ? 'border-amber/60 shadow-[inset_3px_0_0_#F6B03A]'
          : 'border-teal/60 shadow-[inset_3px_0_0_#4FE3CE]'
      }`}
      style={{
        width: `${cardWidth}px`,
        minHeight: `${cardMinHeight}px`,
        transform: 'rotate(1.5deg) scale(1.03)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display font-semibold text-[0.95rem] text-text m-0 break-words line-clamp-2 leading-snug">
          {task.title}
        </h4>
        <span
          className={`font-mono text-[0.625rem] font-semibold tracking-[0.04em] uppercase px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
            catColor === 'violet'
              ? 'bg-violet-dim text-violet'
              : catColor === 'amber'
              ? 'bg-amber-dim text-amber'
              : 'bg-teal-dim text-teal'
          }`}
        >
          {task.cat === 'focus' ? <Sparkles size={11} /> : task.cat === 'fire' ? <Flame size={11} /> : <CheckCircle2 size={11} />}
          <span>{task.cat === 'focus' ? 'Focus' : task.cat === 'fire' ? 'Urgent' : 'Admin'}</span>
        </span>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="font-mono text-[0.625rem] font-semibold px-1.5 py-0.5 rounded bg-violet/15 border border-violet/30 text-violet"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="font-mono text-[0.6rem] text-faint">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Snippet / Subtask Summary */}
      {subtasksTotal > 0 ? (
        <div className="flex items-center gap-2 text-[0.72rem] font-mono text-muted bg-void/50 px-2.5 py-1.5 rounded-lg border border-line/50">
          <span className="w-2 h-2 rounded-full bg-teal shrink-0" />
          <span className="truncate">Checklist: {subtasksDone}/{subtasksTotal} completed</span>
        </div>
      ) : task.notes ? (
        <p className="text-[0.72rem] font-mono text-[#C8E8DC] line-clamp-2 m-0 bg-void/50 p-2 rounded-lg border border-line/50 leading-relaxed">
          {task.notes}
        </p>
      ) : null}

      {/* Footer Meta */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-line/50 text-[0.68rem] font-mono text-faint">
        <div className="flex items-center gap-2.5">
          <span className="bg-elevated px-1.5 py-0.5 rounded text-text font-semibold border border-line">
            {task.w}×{task.h}
          </span>
          {task.timer && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              <span>{Math.floor(task.timer.total / 60)}m</span>
            </span>
          )}
          {task.energy && (
            <span className="flex items-center gap-1">
              <Battery size={11} />
              <span>{task.energy}/5</span>
            </span>
          )}
        </div>
        <span className="text-violet font-semibold tracking-wide">◈ Release to Drop</span>
      </div>
    </div>
  );
};

export const BentoGrid: React.FC<{ onNewTask: () => void }> = ({ onNewTask }) => {
  const { tasks, gridLayout, reorderTasks, promotePenItem } = useStore();

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);
  const isFull = used >= TOTAL_CELLS;
  const gridTasks = tasks.filter(t => !t.archived && !t.isPen && !t.dormant);
  const soundsEnabled = useStore(s => s.soundsEnabled);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId]     = useState<string | null>(null);

  const activeTask = activeId ? gridTasks.find(t => t.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // 6px movement triggers drag — snappy without blocking clicks
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
      if (soundsEnabled) playDrop();
    }
    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const handlePenDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData('application/x-workstash-pen');
    if (!raw) return;
    try {
      const { penId, index } = JSON.parse(raw) as { penId: string; index: number };
      promotePenItem(penId, index);
    } catch {
      // Ignore malformed drag payloads from outside the app.
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-workstash-pen')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={handlePenDrop}
    >
      <div className="flex-1 p-[18px_22px_10px] flex flex-col min-h-0">
        <div className={`hidden items-center gap-2.5 text-[0.8125rem] text-amber font-medium mb-3 p-3 bg-amber-dim border border-amber/25 rounded-xl ${isFull ? '!flex' : ''}`}>
          <span className="font-mono text-[0.7rem] tracking-wide uppercase">Full</span>
          Grid at capacity — resize, complete, or archive a block before adding more.
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
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
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeTask ? <DragOverlayCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
      <HoldingPenDock />
    </div>
  );
};
