import React, { useState, useEffect, useRef } from 'react';
import { useStore, type Task, type TaskCategory, occupiedCells } from '../store';
import { TileContent } from './TileContent';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

function sizeLabel(w: number, h: number) {
  if (w === 1 && h === 1) return 'Micro';
  if (w === 2 && h === 1) return 'List';
  if (w === 2 && h === 2) return 'Focus';
  if (w === 3 && h === 2) return 'Deep';
  return `${w}×${h}`;
}

export const Tile: React.FC<{ task: Task }> = ({ task }) => {
  const { archiveTask, openShutter, setTileSize, tasks, mode, setFocusedTask, addToast, setIsHoveringTask, gridLayout, updateTitle, updateCategory } = useStore();

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const isMicro = task.w === 1 && task.h === 1;
  const isList = task.w === 2 && task.h === 1;
  const isDeep = task.w >= 3 && task.h >= 2;

  const [isCompleting, setIsCompleting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

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
    if (!catMenuOpen && !sizeMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (catMenuOpen && catMenuRef.current && !catMenuRef.current.contains(target)) {
        setCatMenuOpen(false);
      }
      if (sizeMenuOpen && sizeMenuRef.current && !sizeMenuRef.current.contains(target)) {
        setSizeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [catMenuOpen, sizeMenuOpen]);

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

  const finishArchive = () => {
    archiveTask(task.id);
    addToast(`Archived "${task.title}"`, '✓');
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting || isChecking) return;
    setIsCompleting(true);
    setTimeout(finishArchive, 480);
  };

  const handleHeroCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isChecking || isCompleting) return;
    setIsChecking(true);
    setTimeout(() => {
      setIsCompleting(true);
      setTimeout(finishArchive, 280);
    }, 420);
  };

  const handleResize = (e: React.MouseEvent, w: number, h: number) => {
    e.stopPropagation();
    const currentUsed = occupiedCells(tasks);
    const delta = (w * h) - (task.w * task.h);
    if (currentUsed + delta <= TOTAL_CELLS) {
      setTileSize(task.id, w, h);
    } else {
      addToast('Not enough room — free up space first', '⚠');
    }
  };

  const handleDoubleClick = () => {
    if (mode === 'deep' && !isEditingTitle) {
      setFocusedTask(task.id);
    }
  };

  const sizeOptions = [
    { w: 1, h: 1, label: '1×1' },
    { w: 2, h: 1, label: '2×1' },
    { w: 2, h: 2, label: '2×2' },
    { w: 3, h: 2, label: '3×2' }
  ];

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

  const style = {
    gridColumn: `span ${task.w}`,
    gridRow: `span ${task.h}`,
    transform: CSS.Transform.toString(transform),
    transition: transition || 'opacity 0.45s cubic-bezier(0.3, 0.9, 0.3, 1), transform 0.45s cubic-bezier(0.3, 0.9, 0.3, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  const titleClass = isMicro
    ? 'font-display font-semibold text-[0.875rem] leading-snug tracking-[-0.02em] m-0 break-words text-center'
    : isList
    ? 'font-display font-semibold text-[0.9rem] leading-snug tracking-[-0.02em] m-0 break-words'
    : isDeep
    ? 'font-display font-semibold text-[1.05rem] leading-snug tracking-[-0.025em] m-0 break-words'
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
          setSizeMenuOpen(false);
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
      className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-200 ${
        isHovered || isEditingTitle ? 'opacity-100' : 'opacity-35'
      }`}
    >
      <div {...attributes} {...listeners} className="tile-action cursor-grab active:cursor-grabbing" title="Drag to reorder">
        <DragIcon />
      </div>
      {!isMicro && (
        <button type="button" className="tile-action" title="Focus Shutter (F)" onClick={(e) => { e.stopPropagation(); openShutter(task.id); }}>
          <ExpandIcon />
        </button>
      )}
      {!isMicro && (
        <button type="button" className="tile-action hover:!text-danger" title="Archive" onClick={handleArchive}>
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
        className={`${titleClass} cursor-text text-text hover:text-violet transition-colors ${centered ? '' : 'flex-1 min-w-0'}`}
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

  const sizeChips = isMicro ? (
    <div className="relative" ref={sizeMenuRef}>
      <button
        type="button"
        className="tile-chip !text-[0.65rem] !px-2 !py-0.5"
        title="Change size"
        onClick={(e) => {
          e.stopPropagation();
          setSizeMenuOpen(o => !o);
          setCatMenuOpen(false);
        }}
      >
        {task.w}×{task.h} ▾
      </button>
      {sizeMenuOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 z-30 bg-elevated-hi border border-line rounded-xl p-1 shadow-toast min-w-[104px]">
          {sizeOptions.map(opt => (
            <button
              key={`${opt.w}x${opt.h}`}
              type="button"
              className={`w-full text-left text-[0.75rem] font-medium py-1.5 px-2.5 rounded-lg border-none cursor-pointer font-mono ${
                task.w === opt.w && task.h === opt.h
                  ? 'bg-elevated text-text'
                  : 'bg-transparent text-muted hover:text-text hover:bg-elevated'
              }`}
              onClick={(e) => {
                handleResize(e, opt.w, opt.h);
                setSizeMenuOpen(false);
              }}
            >
              {opt.label}
              <span className="text-faint ml-1.5 font-sans text-[0.65rem]">
                {sizeLabel(opt.w, opt.h)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="flex gap-1 flex-wrap justify-end">
      {sizeOptions.map(opt => (
        <button
          key={`${opt.w}x${opt.h}`}
          type="button"
          className={`tile-chip ${task.w === opt.w && task.h === opt.h ? 'is-active' : ''}`}
          onClick={(e) => handleResize(e, opt.w, opt.h)}
          title={`Resize to ${opt.label}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const footer = isMicro ? (
    <div className="flex items-center justify-between gap-2 shrink-0 mt-auto pt-1.5 w-full">
      {catBadge}
      {sizeChips}
    </div>
  ) : (
    <div className="flex items-center justify-between gap-2 flex-wrap shrink-0 mt-2.5 pt-0.5">
      <div className="flex items-center gap-2">
        {catBadge}
        <span className="size-ribbon">{sizeLabel(task.w, task.h)}</span>
      </div>
      {sizeChips}
    </div>
  );

  return (
    <GlowCard
      ref={setNodeRef}
      customSize={true}
      data-lenis-prevent="true"
      glowColor={glowColorMap[task.cat as keyof typeof glowColorMap] || 'blue'}
      className={`bg-surface/95 shadow-tile overflow-hidden flex flex-col transition-[background,box-shadow,opacity,filter] duration-300 min-h-0 ${catClass} ${
        isMicro ? 'p-3' : isDeep ? 'p-4' : 'p-3.5'
      } ${
        task.parked ? 'opacity-[0.38] saturate-[0.45]' : ''
      } ${isCompleting ? 'animate-completePop' : ''} ${isEntering ? 'animate-tileIn' : ''} ${
        isDragging ? 'opacity-55 ring-2 ring-violet/70 shadow-xl scale-[1.015]' : ''
      } ${isHovered && !task.parked ? 'bg-elevated/40' : ''} ${
        isList ? 'border-l-[3px] border-l-teal/40' : ''
      } ${isDeep ? 'ring-1 ring-violet/15' : ''}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {isMicro ? (
        <div className="flex flex-col h-full items-center relative min-h-0">
          <div className="absolute top-0 right-0 z-10">{actionBar}</div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2.5 w-full px-1 pt-1 min-h-0">
            <button
              type="button"
              className={`hero-check ${isChecking ? 'is-checking' : ''}`}
              title="Complete task"
              onClick={handleHeroCheck}
              aria-label={`Complete ${task.title}`}
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
          <div className={`flex-1 min-h-0 flex flex-col ${isList ? 'mt-1.5' : 'mt-3'}`}>
            <TileContent task={task} />
          </div>
          {footer}
        </>
      )}
    </GlowCard>
  );
};
