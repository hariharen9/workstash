import React, { useRef, useState, useEffect } from 'react';
import { useStore, occupiedCells } from '../store';
import { GlowCard } from './GlowCard';
import { playClick, playCreate, playArchive } from '../sounds';
import { Inbox, Plus, ChevronDown, ChevronUp, ArrowUpRight, X, Sparkles } from 'lucide-react';

export const HoldingPenDock: React.FC = () => {
  const { tasks, gridLayout, addPenItem, removePenItem, promotePenItem, soundsEnabled, addToast } = useStore();
  const pen = tasks.find(t => t.isPen && !t.completed);
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  const TOTAL_CELLS = gridLayout === '8x4' ? 32 : gridLayout === '6x5' ? 30 : 24;
  const used = occupiedCells(tasks);
  const isFull = used >= TOTAL_CELLS;

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [expanded]);

  if (!pen) return null;

  const items = pen.items || [];
  const count = items.length;

  const handleAdd = () => {
    const text = inputRef.current?.value.trim();
    if (!text) return;
    addPenItem(pen.id, text);
    if (soundsEnabled) playCreate();
    addToast(`Parked in Inbox: "${text}"`, '📥');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePromote = (index: number, text: string) => {
    if (isFull) {
      addToast('Grid at capacity — free up space first', '⚠');
      return;
    }
    promotePenItem(pen.id, index);
    if (soundsEnabled) playClick();
    addToast(`Promoted to grid: "${text}"`, '↗');
  };

  const handleRemove = (index: number) => {
    removePenItem(pen.id, index);
    if (soundsEnabled) playArchive();
  };

  return (
    <aside 
      aria-label="Inbox quick capture"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end max-w-[calc(100vw-2rem)]"
      data-lenis-prevent="true"
    >
      {/* ─── Expanded Floating Drawer ─── */}
      {expanded ? (
        <GlowCard
          customSize
          glowColor="blue"
          className="w-[300px] sm:w-[350px] max-w-[calc(100vw-2rem)] bg-surface/98 backdrop-blur-2xl border border-line rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-tileIn"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-line/70 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-teal/15 text-teal border border-teal/30 flex items-center justify-center shrink-0">
                <Inbox size={15} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-[0.88rem] m-0 tracking-tight leading-none text-text">
                  Inbox (Holding Pen)
                </h3>
                <p className="text-[0.68rem] text-muted m-0 mt-0.5 font-mono">
                  Off-grid quick buffer ({count} {count === 1 ? 'item' : 'items'})
                </p>
              </div>
            </div>

            <button
              type="button"
              className="tile-action !w-7 !h-7 !rounded-lg"
              onClick={() => {
                setExpanded(false);
                if (soundsEnabled) playClick();
              }}
              title="Collapse inbox"
              aria-label="Collapse holding pen"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Quick Capture Input */}
          <div className="flex items-center gap-1.5 shrink-0 bg-elevated/70 border border-line rounded-xl p-1.5 focus-within:border-faint focus-within:bg-elevated transition-colors">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-[0.8125rem] text-text px-2 font-sans placeholder:text-faint"
              placeholder="Capture a stray thought..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="w-7 h-7 rounded-lg bg-text text-void hover:opacity-90 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0"
              title="Add to inbox"
              aria-label="Capture item"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1.5 min-h-[80px] max-h-[220px] tile-scroll">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted px-3 my-auto">
                <Sparkles size={20} className="text-faint/60 mb-1.5" />
                <p className="text-[0.78rem] font-medium text-muted m-0">Inbox is empty</p>
                <p className="text-[0.68rem] text-faint m-0 mt-0.5">
                  Park stray tasks here so they don't consume grid capacity
                </p>
              </div>
            ) : (
              items.map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-workstash-pen', JSON.stringify({ penId: pen.id, index: i }));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="flex items-center gap-2 bg-elevated/60 border border-line/70 hover:border-faint rounded-xl px-2.5 py-2 cursor-grab active:cursor-grabbing transition-all group/item"
                  title="Drag onto the grid to promote"
                >
                  <span className="font-mono text-[0.65rem] text-faint shrink-0 w-4 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[0.8rem] text-text truncate flex-1 min-w-0 font-medium">
                    {item}
                  </span>
                  <button
                    type="button"
                    className="tile-action !w-6 !h-6 hover:!text-teal !rounded-md"
                    title="Promote to grid as 1×1 block"
                    onClick={() => handlePromote(i, item)}
                    aria-label="Promote to grid"
                  >
                    <ArrowUpRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="tile-action !w-6 !h-6 hover:!text-danger !rounded-md"
                    title="Discard"
                    onClick={() => handleRemove(i)}
                    aria-label="Discard item"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </GlowCard>
      ) : (
        /* ─── Collapsed Floating Pill ─── */
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            if (soundsEnabled) playClick();
          }}
          className="
            group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl
            bg-surface/95 backdrop-blur-xl border border-line
            hover:border-faint hover:bg-elevated-hi
            shadow-tile hover:shadow-2xl
            transition-all duration-200 cursor-pointer select-none
          "
          aria-label="Open holding pen inbox"
        >
          <div className="w-6 h-6 rounded-lg bg-teal/15 text-teal border border-teal/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Inbox size={13} />
          </div>
          <span className="text-[0.8rem] font-semibold text-text tracking-tight">
            Inbox
          </span>
          {count > 0 ? (
            <span className="bg-teal text-void font-mono font-bold text-[0.68rem] px-2 py-0.5 rounded-full leading-none shrink-0 shadow-sm">
              {count}
            </span>
          ) : (
            <span className="text-[0.72rem] text-faint font-mono font-medium">0</span>
          )}
          <ChevronUp size={14} className="text-muted group-hover:text-text transition-colors" />
        </button>
      )}
    </aside>
  );
};
