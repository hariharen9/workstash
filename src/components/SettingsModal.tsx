import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { GlowCard } from './GlowCard';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { gridLayout, setGridLayout, resetWorkspace } = useStore();
  const [localLayout, setLocalLayout] = useState(gridLayout);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalLayout(gridLayout);
      setConfirmReset(false);
    }
  }, [isOpen, gridLayout]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGridLayout(localLayout);
    onClose();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetWorkspace();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-tileIn"
      data-lenis-prevent="true"
      onClick={onClose}
    >
      <GlowCard customSize glowColor="purple" className="w-full max-w-[420px] bg-surface rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-text text-xl cursor-pointer">&times;</button>
        <h2 className="text-xl font-display font-semibold tracking-tight">Workspace Settings</h2>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-mono tracking-widest text-muted uppercase">Grid Capacity</label>
          <div className="grid grid-cols-3 gap-3">
            {(['6x4', '8x4', '6x5'] as const).map(layout => (
              <button
                key={layout}
                onClick={() => setLocalLayout(layout)}
                className={`py-3 rounded-lg border transition-all text-sm font-mono cursor-pointer ${localLayout === layout ? 'bg-elevated-hi border-faint text-text' : 'bg-elevated border-line text-muted hover:border-faint hover:text-text'}`}
              >
                {layout}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1">Adjusting this modifies the strict physical boundary of your workspace to combat cognitive overwhelm.</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <label className="text-sm font-mono tracking-widest text-muted uppercase">Data</label>
          <p className="text-xs text-muted">Your workspace is saved automatically in this browser. Reset restores the starter tasks and clears analytics.</p>
          <button
            type="button"
            onClick={handleReset}
            className={`w-full py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
              confirmReset
                ? 'bg-danger/20 border-danger text-danger hover:bg-danger/30'
                : 'bg-elevated border-line text-muted hover:text-text hover:border-faint'
            }`}
          >
            {confirmReset ? 'Click again to confirm reset' : 'Reset workspace'}
          </button>
        </div>

        <button
          onClick={handleSave}
          className="mt-2 w-full py-3 bg-violet hover:bg-violet/90 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Save Settings
        </button>
      </GlowCard>
    </div>
  );
};
