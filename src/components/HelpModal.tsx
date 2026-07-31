import React from 'react';
import { GlowCard } from './GlowCard';

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-tileIn"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="purple"
        className="w-full max-w-[560px] max-h-[min(86vh,720px)] bg-surface rounded-2xl shadow-toast flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-line shrink-0">
          <div>
            <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] m-0">What is WorkStash?</h2>
            <p className="text-[0.875rem] text-muted m-0 mt-1.5 leading-snug">
              A spatial task workspace — not another endless list.
            </p>
          </div>
          <button type="button" className="tile-action !w-9 !h-9" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="p-6 pt-5 overflow-y-auto tile-scroll flex flex-col gap-5 text-[0.875rem] leading-relaxed text-muted" data-lenis-prevent="true">
          <section>
            <h3 className="font-display text-[1rem] font-semibold text-text tracking-[-0.02em] m-0 mb-2">The idea</h3>
            <p className="m-0">
              WorkStash treats tasks as physical blocks on a finite bento grid. Size equals cognitive weight.
              Capacity is limited on purpose so you can’t hide overwhelm behind an infinite backlog.
            </p>
          </section>

          <section>
            <h3 className="font-display text-[1rem] font-semibold text-text tracking-[-0.02em] m-0 mb-2">How it’s different</h3>
            <ul className="m-0 pl-4 flex flex-col gap-2">
              <li>
                <span className="text-text font-medium">Space over lists</span> — you see load at a glance instead of scrolling a wall of checkboxes.
              </li>
              <li>
                <span className="text-text font-medium">Board view modes</span> — All Blocks, Solo Focus, Urgent First, and Admin Sweep reshape the board for how you’re working now.
              </li>
              <li>
                <span className="text-text font-medium">Inbox (Holding Pen)</span> — an off-grid inbox for interruptions. It never consumes capacity cells.
              </li>
              <li>
                <span className="text-text font-medium">End-of-Day Defrag</span> — a ritual to clear completed work and compact the grid.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-display text-[1rem] font-semibold text-text tracking-[-0.02em] m-0 mb-2">Block sizes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { size: '1×1 Micro', desc: 'Tap-to-complete. Checkbox is the whole point — for tiny admin hits.' },
                { size: '2×1 List', desc: 'Checklist strip. Scroll through subtasks; progress bar shows done/total.' },
                { size: '2×2 Focus', desc: 'Tabbed tools: notes, tasks, timer, and energy in one block.' },
                { size: '3×2 Deep', desc: 'Split workspace — notes and checklist side by side, timer always visible.' },
              ].map(item => (
                <div key={item.size} className="rounded-xl border border-line bg-elevated/50 p-3">
                  <div className="font-mono text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-violet mb-1">{item.size}</div>
                  <p className="m-0 text-[0.8125rem] leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-display text-[1rem] font-semibold text-text tracking-[-0.02em] m-0 mb-2">Quick tips</h3>
            <ul className="m-0 pl-4 flex flex-col gap-1.5">
              <li>Click a title to rename · click the category badge to reclassify</li>
              <li>Hover a block and press <span className="text-text font-semibold">F</span> for Focus Shutter · <span className="text-text font-semibold">Esc</span> to exit</li>
              <li>In Solo Focus mode, double-click a tile to make it the active focus</li>
              <li>Promote Holding Pen items with <span className="text-text font-semibold">↗</span> onto the grid</li>
              <li>Your workspace saves automatically in this browser</li>
            </ul>
          </section>
        </div>

        <div className="p-5 pt-3 border-t border-line shrink-0">
          <button
            type="button"
            className="w-full border-none cursor-pointer font-semibold text-[0.875rem] py-3 rounded-xl bg-text text-void hover:-translate-y-px transition-transform"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </GlowCard>
    </div>
  );
};
