import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { GlowCard } from './GlowCard';
import { playClick, playThemeToggle } from '../sounds';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { gridLayout, setGridLayout, resetWorkspace, soundsEnabled, toggleSounds, theme, toggleTheme } = useStore();
  const [localLayout, setLocalLayout] = useState(gridLayout);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalLayout(gridLayout);
      setConfirmReset(false);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, gridLayout, onClose]);

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

        {/* Sound Pack */}
        <div className="flex flex-col gap-2.5 border-t border-line pt-4">
          <label className="text-sm font-mono tracking-widest text-muted uppercase">Sound Pack</label>
          <div className="flex items-center justify-between gap-3 bg-elevated/60 border border-line/70 rounded-xl px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text">Interface Sounds</span>
              <span className="text-xs text-muted">Subtle synthesized audio for clicks, completions, and defrag</span>
            </div>
            <button
              type="button"
              onClick={() => {
                toggleSounds();
                if (!soundsEnabled) playClick();
              }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 border ${
                soundsEnabled ? 'bg-violet border-violet/60' : 'bg-elevated-hi border-line'
              }`}
              aria-label={soundsEnabled ? 'Disable sounds' : 'Enable sounds'}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-200 ${
                  soundsEnabled ? 'left-[22px] bg-white' : 'left-0.5 bg-faint'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="flex flex-col gap-2.5 border-t border-line pt-4">
          <label className="text-sm font-mono tracking-widest text-muted uppercase">Appearance</label>
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (theme !== t) {
                    toggleTheme();
                    if (soundsEnabled) playThemeToggle();
                  }
                }}
                className={`py-3 rounded-xl border transition-all text-sm font-medium cursor-pointer flex items-center justify-center gap-2 ${
                  theme === t
                    ? 'bg-elevated-hi border-faint text-text shadow-sm'
                    : 'bg-elevated border-line text-muted hover:border-faint hover:text-text'
                }`}
              >
                {t === 'dark' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
                  </svg>
                )}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <label className="text-sm font-mono tracking-widest text-muted uppercase">Data</label>
          <p className="text-xs text-muted">Your workspace syncs automatically to your signed-in account. Reset restores the starter tasks and clears analytics.</p>
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
