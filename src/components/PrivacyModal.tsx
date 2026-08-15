import React, { useEffect } from 'react';
import { GlowCard } from './GlowCard';
import { Shield, Lock, Database, Trash2, CheckCircle2, X, Code2 } from 'lucide-react';

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard
        customSize
        glowColor="blue"
        className="w-full max-w-[620px] bg-surface/98 backdrop-blur-2xl border border-line rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-2xl relative max-h-[88vh] overflow-hidden text-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal/15 text-teal border border-teal/30 flex items-center justify-center shadow-sm">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold tracking-tight text-text leading-tight m-0">
                Privacy & Data Sovereignty
              </h2>
              <p className="text-xs text-muted m-0 mt-0.5 font-mono">
                100% Open Source · Local-first architecture · Zero tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tile-action !w-8 !h-8 !rounded-xl"
            aria-label="Close privacy policy"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-[0.83rem] text-muted leading-relaxed tile-scroll">
          <div className="p-4 rounded-2xl bg-elevated/60 border border-line/80 flex flex-col gap-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
              <Lock size={14} /> Core Commitment
            </span>
            <p className="text-text font-medium m-0 leading-snug">
              WorkStash is built with a strict privacy-first foundation. Your thoughts, tasks, and scratchpad notes belong exclusively to you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Open Source Transparency */}
            <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet/15 text-violet flex items-center justify-center shrink-0 mt-0.5">
                <Code2 size={15} />
              </div>
              <div className="flex-1">
                <strong className="text-text text-xs block mb-0.5">100% Open Source & Auditable (MIT License)</strong>
                <p className="m-0 text-xs text-muted leading-normal">
                  WorkStash is completely open source under the permissive MIT license. Every line of code, storage mechanism, and network call is transparent and auditable by anyone in the developer community.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal/15 text-teal flex items-center justify-center shrink-0 mt-0.5">
                <Database size={15} />
              </div>
              <div className="flex-1">
                <strong className="text-text text-xs block mb-0.5">Local-First Storage & Offline Safety</strong>
                <p className="m-0 text-xs text-muted leading-normal">
                  All workspace operations execute locally in your browser. If you use WorkStash offline, your data stays strictly in local browser storage and is never uploaded anywhere.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal/15 text-teal flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 size={15} />
              </div>
              <div className="flex-1">
                <strong className="text-text text-xs block mb-0.5">Encrypted Cloud Synchronization</strong>
                <p className="m-0 text-xs text-muted leading-normal">
                  When signed in with Google or Email, changes synchronize over encrypted SSL connections directly to your private Firebase Cloud Firestore document (<code className="text-teal font-mono">users/&#123;uid&#125;/workspace/main</code>).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber/15 text-amber flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={15} />
              </div>
              <div className="flex-1">
                <strong className="text-text text-xs block mb-0.5">Zero Third-Party Trackers & Ads</strong>
                <p className="m-0 text-xs text-muted leading-normal">
                  We do not embed third-party behavioral trackers, advertising SDKs, or data brokers. Web Audio synthesizer tones are generated purely in code with zero external file requests.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-elevated/40 border border-line flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-danger/15 text-danger flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 size={15} />
              </div>
              <div className="flex-1">
                <strong className="text-text text-xs block mb-0.5">Complete Deletion & Export Rights (GDPR / CCPA)</strong>
                <p className="m-0 text-xs text-muted leading-normal">
                  Export your entire workspace to a clean offline <code className="text-violet font-mono">.json</code> backup at any time from Settings. You can also trigger an irreversible 3-step Account Deletion to permanently erase all cloud and auth records.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-line/80 shrink-0">
          <span className="text-[0.72rem] font-mono text-faint">
            Effective: 2026 · Built by Hariharen
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-text text-void hover:opacity-90 transition-transform active:scale-95 shadow-md cursor-pointer ml-auto"
          >
            I Understand
          </button>
        </div>
      </GlowCard>
    </div>
  );
};
