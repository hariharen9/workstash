import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { GlowCard } from './GlowCard';

export const HoldingPenDock: React.FC = () => {
  const { tasks, addPenItem, removePenItem, promotePenItem } = useStore();
  const pen = tasks.find(t => t.isPen && !t.completed);
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(true);

  if (!pen) return null;

  const items = pen.items || [];
  const count = items.length;

  return (
    <GlowCard
      customSize
      glowColor="blue"
      className="shrink-0 mx-[18px] mb-[18px] mt-0 bg-surface/95 rounded-2xl border border-line/80 shadow-tile overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line/70">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-[0.6875rem] font-semibold tracking-[0.06em] uppercase text-muted bg-elevated px-2 py-1 rounded-md border border-line">
            Inbox
          </span>
          <div className="min-w-0">
            <p className="font-display font-semibold text-[0.9rem] m-0 tracking-[-0.02em] leading-none">Inbox (Holding Pen)</p>
            <p className="text-[0.72rem] text-muted m-0 mt-1 truncate">
              Off-grid — captures interruptions without using capacity
            </p>
          </div>
        </div>
        <span className="font-mono text-[0.75rem] text-faint tabular-nums shrink-0">{count}</span>
        <button
          type="button"
          className="tile-action !w-8 !h-8"
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse holding pen' : 'Expand holding pen'}
        >
          {expanded ? '▾' : '▸'}
        </button>
      </div>

      {expanded && (
        <div className="px-4 py-3 flex flex-col gap-2.5">
          <div className="flex gap-2 max-h-[7.5rem] overflow-x-auto overflow-y-hidden pb-0.5">
            {count === 0 ? (
              <div className="text-[0.8125rem] text-muted py-2 px-1">
                Nothing captured — park stray thoughts here so they don’t clutter the grid.
              </div>
            ) : (
              items.map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  className="flex items-center gap-2 shrink-0 max-w-[280px] bg-elevated border border-line rounded-xl px-3 py-2"
                >
                  <span className="font-mono text-[0.65rem] text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[0.8125rem] text-text truncate flex-1 min-w-0">{item}</span>
                  <button
                    type="button"
                    className="tile-action !w-7 !h-7 hover:!text-teal"
                    title="Promote to grid as 1×1"
                    onClick={() => promotePenItem(pen.id, i)}
                  >
                    ↗
                  </button>
                  <button
                    type="button"
                    className="tile-action !w-7 !h-7"
                    title="Discard"
                    onClick={() => removePenItem(pen.id, i)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <input
            ref={inputRef}
            className="tile-field !py-2"
            type="text"
            placeholder="Capture a stray thought… (Enter)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputRef.current?.value.trim()) {
                addPenItem(pen.id, inputRef.current.value.trim());
                inputRef.current.value = '';
              }
            }}
          />
        </div>
      )}
    </GlowCard>
  );
};
