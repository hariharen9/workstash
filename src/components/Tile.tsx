import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore, type Task, type TaskCategory, occupiedCells } from '../store';
import { TileContent } from './TileContent';
import { TileCompleted } from './TileCompleted';
import { useSortable } from '@dnd-kit/sortable';
import { GlowCard } from './GlowCard';

const DragIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
    <circle cx="5" cy="3" r="1.15" />
    <circle cx="9" cy="3" r="1.15" />
    <circle cx="5" cy="7" r="1.15" />
    <circle cx="9" cy="7" r="1.15" />
    <circle cx="5" cy="11" r="1.15" />
    <circle cx="9" cy="11" r="1.15" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const CATEGORIES: { id: TaskCategory; label: string; short: string }[] = [
  { id: 'focus', label: 'Deep Focus', short: 'Focus' },
  { id: 'fire', label: 'Urgent', short: 'Urgent' },
  { id: 'admin', label: 'Quick Admin', short: 'Admin' },
];

const ResizeGripIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
    <circle cx="2" cy="6" r="1" />
    <circle cx="5" cy="6" r="1" />
    <circle cx="5" cy="3" r="1" />
  </svg>
);

export const Tile: React.FC<{ task: Task; isBeingDragged?: boolean; isDragTarget?: boolean }> = ({ task, isBeingDragged = false, isDragTarget = false }) => {
  const { archiveTask, toggleCompleteTask, openShutter, setTileSize, tasks, mode, setFocusedTask, addToast, setIsHoveringTask, gridLayout, updateTitle, updateCategory, selectedTagFilter, setSelectedTagFilter } = useStore();

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const maxCols = gridLayout === '8x4' ? 8 : 6;
  const maxRows = gridLayout === '6x5' ? 5 : 4;

  const isMicro    = task.w === 1 && task.h === 1;
  const isSlimWide = task.w >= 2 && task.h === 1;
  const isLarge    = task.w >= 3 && task.h >= 2;

  const [isCompleting, setIsCompleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [catMenuOpen, setCatMenuOpen] = useState(false);

  // Corner drag-resize state
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [resizeGhost, setResizeGhost] = useState<{ w: number; h: number; x: number; y: number } | null>(null);
  const resizeDragRef = useRef<{ startX: number; startY: number; startW: number; startH: number; cellW: number; cellH: number } | null>(null);
  const tileElementRef = useRef<HTMLElement | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef } = useSortable({ id: task.id });

  // Forward the sortable ref AND keep our own ref for measuring resize
  const combinedRef = useCallback((el: HTMLElement | null) => {
    setNodeRef(el);
    tileElementRef.current = el;
  }, [setNodeRef]);

  useEffect(() => {
    const t = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isEditingTitle) setDraftTitle(task.title);
  }, [task.title, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (!catMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (catMenuOpen && catMenuRef.current && !catMenuRef.current.contains(target)) {
        setCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [catMenuOpen]);

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

  const commitTitle = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateTitle(task.id, trimmed);
    } else {
      setDraftTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting || isChecking) return;
    setIsCompleting(true);
    setTimeout(() => {
      archiveTask(task.id);
      addToast(`Archived — "${task.title}"`, '📦');
    }, 280);
  };

  const handleHeroCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isChecking) return;
    setIsChecking(true);
    setTimeout(() => {
      toggleCompleteTask(task.id);
      setIsChecking(false);
      if (!task.completed) {
        addToast(`Done — "${task.title}" (awaiting defrag)`, '✓');
      } else {
        addToast(`Reopened "${task.title}"`, '↩');
      }
    }, 320);
  };

  // Corner drag-resize handlers — use pointer capture for clean cross-element tracking
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = tileElementRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cellW = rect.width / task.w;
    const cellH = rect.height / task.h;
    resizeDragRef.current = { startX: e.clientX, startY: e.clientY, startW: task.w, startH: task.h, cellW, cellH };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingResize(true);
    setResizeGhost({ w: task.w, h: task.h, x: e.clientX, y: e.clientY });
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingResize || !resizeDragRef.current) return;
    const { startX, startY, startW, startH, cellW, cellH } = resizeDragRef.current;
    const newW = Math.max(1, Math.min(maxCols, Math.round(startW + (e.clientX - startX) / cellW)));
    const newH = Math.max(1, Math.min(maxRows, Math.round(startH + (e.clientY - startY) / cellH)));
    setResizeGhost({ w: newW, h: newH, x: e.clientX, y: e.clientY });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingResize || !resizeDragRef.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const { startX, startY, startW, startH, cellW, cellH } = resizeDragRef.current;
    const newW = Math.max(1, Math.min(maxCols, Math.round(startW + (e.clientX - startX) / cellW)));
    const newH = Math.max(1, Math.min(maxRows, Math.round(startH + (e.clientY - startY) / cellH)));
    if (newW !== startW || newH !== startH) {
      const delta = (newW * newH) - (startW * startH);
      if (occupiedCells(tasks) + delta <= TOTAL_CELLS) {
        setTileSize(task.id, newW, newH);
      } else {
        addToast('Not enough room — free up space first', '⚠');
      }
    }
    setIsDraggingResize(false);
    setResizeGhost(null);
    resizeDragRef.current = null;
  };

  const handleDoubleClick = () => {
    if (mode === 'deep' && !isEditingTitle) {
      setFocusedTask(task.id);
    }
  };

  const catClass =
    task.cat === 'focus'
    ? 'shadow-focus-cat'
    : task.cat === 'fire'
    ? 'shadow-fire-cat'
    : task.cat === 'admin'
    ? 'shadow-admin-cat'
    : '';

  const glowColorMap = {
    focus: 'purple',
    fire: 'orange',
    admin: 'green',
    pen: 'blue'
  } as const;

  const style: React.CSSProperties = {
    gridColumn: `span ${task.w}`,
    gridRow: `span ${task.h}`,
    zIndex: isDragTarget ? 20 : 1,
  };

  const titleClass = isMicro
    ? 'font-display font-semibold text-[0.875rem] leading-snug tracking-[-0.02em] m-0 break-words text-center'
    : isSlimWide
    ? 'font-display font-semibold text-[0.9rem] leading-snug tracking-[-0.02em] m-0 break-words'
    : isLarge
    ? 'font-display font-semibold text-[1.05rem] leading-snug tracking-[-0.025em] m-0 break-words'
    : task.w === 1
    ? 'font-display font-semibold text-[0.85rem] leading-snug tracking-[-0.02em] m-0 break-words'
    : 'font-display font-semibold text-[0.98rem] leading-snug tracking-[-0.02em] m-0 break-words';

  const catBadge = !task.isPen && (
    <div className="relative" ref={catMenuRef}>
      <button
        type="button"
        className={`font-mono text-[0.6875rem] font-semibold tracking-[0.04em] uppercase px-2 py-1 rounded-md border-none cursor-pointer transition-opacity hover:opacity-90 ${
          isMicro ? '!text-[0.625rem] !px-1.5 !py-0.5' : ''
        } ${
          task.cat === 'focus' ? 'bg-violet-dim text-violet' :
          task.cat === 'fire' ? 'bg-amber-dim text-amber' :
          'bg-teal-dim text-teal'
        }`}
        title="Change category"
        onClick={(e) => {
          e.stopPropagation();
          setCatMenuOpen(o => !o);
        }}
      >
        {CATEGORIES.find(c => c.id === task.cat)?.short ?? 'Task'}
      </button>
      {catMenuOpen && (
        <div className="absolute left-0 bottom-full mb-1.5 z-30 bg-elevated-hi border border-line rounded-xl p-1.5 shadow-toast min-w-[140px]">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              className={`w-full text-left text-[0.8125rem] font-medium py-2 px-2.5 rounded-lg border-none cursor-pointer ${
                task.cat === c.id ? 'bg-elevated text-text' : 'bg-transparent text-muted hover:text-text hover:bg-elevated'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                updateCategory(task.id, c.id);
                setCatMenuOpen(false);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const actionBar = !task.isPen && (
    <div
      className={`flex items-center gap-1 shrink-0 transition-opacity duration-200 ${
        isHovered || isEditingTitle || isChecking || task.completed ? 'opacity-100' : 'opacity-40'
      }`}
    >
      {!isMicro && (
        <button
          type="button"
          className={`hero-check-sm ${task.completed || isChecking ? 'is-checking' : ''}`}
          title={task.completed ? "Reopen task" : "Mark task as Done (awaiting defrag)"}
          onClick={handleHeroCheck}
          aria-label={`Mark ${task.title} as done`}
        >
          <span className="hero-check-sm__burst" />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{task.completed ? 'Done ✓' : 'Done'}</span>
        </button>
      )}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="tile-action !w-7 !h-7 cursor-grab active:cursor-grabbing hover:bg-violet-dim hover:text-violet hover:border-violet/40 text-muted"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <DragIcon />
      </button>
      {!isMicro && (
        <button type="button" className="tile-action" title="Focus Shutter (F)" onClick={(e) => { e.stopPropagation(); openShutter(task.id); }}>
          <ExpandIcon />
        </button>
      )}
      {!isMicro && (
        <button type="button" className="tile-action hover:!text-danger" title="Archive / Remove" onClick={handleArchive}>
          <CloseIcon />
        </button>
      )}
    </div>
  );

  const titleBlock = (centered = false) => (
    isEditingTitle ? (
      <input
        ref={titleInputRef}
        className={`${titleClass} ${centered ? 'w-full' : 'flex-1'} min-w-0 bg-elevated border border-line rounded-lg px-2 py-1 text-text outline-none focus:border-faint font-sans text-left`}
        value={draftTitle}
        maxLength={80}
        onChange={(e) => setDraftTitle(e.target.value)}
        onBlur={commitTitle}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commitTitle();
          if (e.key === 'Escape') {
            setDraftTitle(task.title);
            setIsEditingTitle(false);
          }
        }}
      />
    ) : (
      <p
        className={`${titleClass} cursor-text text-text hover:text-violet transition-colors ${centered ? '' : 'flex-1 min-w-0'} ${
          task.completed ? 'line-through text-muted/80' : ''
        }`}
        title="Click to rename"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditingTitle(true);
        }}
      >
        {task.title}
      </p>
    )
  );

  const isTagSpotlightActive = !!selectedTagFilter;
  const matchesTag = selectedTagFilter ? (task.tags || []).includes(selectedTagFilter) : true;

  const footer = isMicro ? (
    <div className="flex items-center gap-1.5 shrink-0 mt-auto pt-1.5 w-full">
      {catBadge}
      {task.tags && task.tags.length > 0 && (
        <span className="font-mono text-[0.55rem] text-violet truncate" title={task.tags.join(', ')}>
          {task.tags[0]}
        </span>
      )}
      {task.completed && (
        <span className="font-mono text-[0.58rem] font-semibold text-teal bg-teal/15 px-1.5 py-0.5 rounded ml-auto" title="Awaiting end-of-day Defrag">
          ✓ Done
        </span>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2 shrink-0 mt-2.5 pt-0.5 flex-wrap">
      {catBadge}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5" data-lenis-prevent="true">
          {task.tags.map(tag => {
            const isCurrentFilter = selectedTagFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                className={`font-mono text-[0.6rem] font-medium px-1.5 py-0.5 rounded transition-all border cursor-pointer ${
                  isCurrentFilter
                    ? 'bg-violet text-void border-violet font-semibold shadow-sm'
                    : 'bg-elevated/70 hover:bg-elevated border-line/60 text-violet/90 hover:text-violet'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  const next = isCurrentFilter ? null : tag;
                  setSelectedTagFilter(next);
                  if (next) {
                    addToast(`Spotlighting ${tag}`, '◈');
                  } else {
                    addToast('Cleared tag spotlight', '✓');
                  }
                }}
                title={isCurrentFilter ? 'Click to clear filter' : `Spotlight tasks with ${tag}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
      {task.completed && (
        <span className="font-mono text-[0.65rem] font-semibold text-teal bg-teal/15 border border-teal/30 px-2 py-0.5 rounded-md" title="This block will be archived on Defrag">
          Awaiting Defrag
        </span>
      )}
      <span
        className={`size-ribbon transition-opacity duration-200 ml-auto ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        title={`${task.w}×${task.h} grid cells`}
      >
        {task.w}×{task.h}
      </span>
    </div>
  );

  if (isBeingDragged) {
    return (
      <div
        ref={combinedRef}
        style={style}
        className={`rounded-radius border-2 border-dashed border-violet/40 bg-violet/[0.04] flex flex-col items-center justify-center gap-2 p-3.5 select-none animate-pulse relative transition-all duration-200 ${
          isDragTarget ? 'border-violet ring-2 ring-violet/50 bg-violet/10' : ''
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-violet-dim/70 border border-violet/30 flex items-center justify-center text-violet shadow-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 9l4-4 4 4M9 5v14M19 15l-4 4-4-4M15 19V5" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="font-mono text-[0.68rem] text-violet font-semibold tracking-wider uppercase">
            {task.w}×{task.h} Blueprint Slot
          </span>
          <span className="text-[0.68rem] text-muted truncate max-w-[180px]">
            &ldquo;{task.title}&rdquo;
          </span>
        </div>
      </div>
    );
  }

  return (
    <GlowCard
      ref={combinedRef}
      customSize={true}
      data-lenis-prevent="true"
      data-task-id={task.id}
      glowColor={glowColorMap[task.cat as keyof typeof glowColorMap] || 'blue'}
      className={`bg-surface/95 shadow-tile overflow-hidden flex flex-col transition-[background,box-shadow,opacity,filter,transform] duration-200 min-h-0 relative ${catClass} ${
        isMicro ? 'p-3' : isLarge ? 'p-4' : 'p-3.5'
      } ${
        isTagSpotlightActive && matchesTag ? '!opacity-100 ring-2 ring-violet shadow-[0_0_24px_rgba(155,140,255,0.45)]' : ''
      } ${
        isTagSpotlightActive && !matchesTag ? 'opacity-25 saturate-[0.25] filter blur-[0.4px]' : ''
      } ${
        isDragTarget ? '!ring-2 !ring-violet !bg-violet/[0.08] !shadow-[0_0_30px_rgba(155,140,255,0.45)] scale-[1.015]' : ''
      } ${
        task.completed ? 'opacity-[0.78] saturate-[0.8] border-teal/40 bg-teal-dim/10 ring-1 ring-teal/20' : ''
      } ${
        task.parked ? 'opacity-[0.38] saturate-[0.45]' : ''
      } ${isCompleting ? 'animate-completePop' : ''} ${isEntering ? 'animate-tileIn' : ''} ${
        isHovered && !task.parked && !isBeingDragged ? 'bg-elevated/40' : ''
      } ${
        isSlimWide ? 'border-l-[3px] border-l-teal/40' : ''
      } ${isLarge ? 'ring-1 ring-violet/15' : ''}`}
      style={style}
      onMouseEnter={() => !isBeingDragged && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Drop indicator badge */}
      {isDragTarget && (
        <div className="absolute top-2 left-2 z-30 font-mono text-[0.625rem] font-bold bg-violet text-void px-2 py-0.5 rounded-md shadow-brand pointer-events-none flex items-center gap-1 animate-bounce">
          <span>⇋ Drop to Swap</span>
        </div>
      )}
      {task.completed ? (
        <TileCompleted task={task} onUndo={handleHeroCheck} onArchive={handleArchive} />
      ) : isMicro ? (
        <div className="flex flex-col h-full items-center relative min-h-0">
          <div className="absolute top-0 right-0 z-10">{actionBar}</div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2.5 w-full px-1 pt-1 min-h-0">
            <button
              type="button"
              className={`hero-check ${isChecking ? 'is-checking' : ''}`}
              title="Mark task as Done"
              onClick={handleHeroCheck}
              aria-label={`Mark ${task.title} as done`}
            >
              <span className="hero-check__burst" />
              <svg className="hero-check__mark" viewBox="0 0 24 24" aria-hidden>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <div className="w-full px-0.5">{titleBlock(true)}</div>
          </div>
          {footer}
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-0 pr-1">{titleBlock(false)}</div>
            {actionBar}
          </div>
          <div className={`flex-1 min-h-0 flex flex-col ${isSlimWide ? 'mt-1.5' : 'mt-3'}`}>
            <TileContent task={task} />
          </div>
          {footer}
        </>
      )}

      {/* Corner drag-resize handle */}
      {!task.isPen && (
        <div
          className={`tile-resize-handle ${isHovered || isDraggingResize ? 'opacity-60' : ''} ${isDraggingResize ? 'is-active' : ''}`}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          title="Drag to resize"
          aria-label="Resize tile"
        >
          <ResizeGripIcon />
        </div>
      )}

      {/* Floating size ghost during drag */}
      {resizeGhost && createPortal(
        <div className="size-ghost" style={{ left: resizeGhost.x, top: resizeGhost.y }}>
          {resizeGhost.w}×{resizeGhost.h}
        </div>,
        document.body
      )}
    </GlowCard>
  );
};
