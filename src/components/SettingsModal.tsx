import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { gridLayout, setGridLayout } = useStore();
  const [localLayout, setLocalLayout] = useState(gridLayout);

  useEffect(() => {
    if (isOpen) {
      setLocalLayout(gridLayout);
    }
  }, [isOpen, gridLayout]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGridLayout(localLayout);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-tileIn">
      <div className="w-full max-w-[420px] bg-surface border border-line rounded-radius p-6 flex flex-col gap-6 shadow-2xl relative">
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

        <button 
          onClick={handleSave}
          className="mt-2 w-full py-3 bg-violet hover:bg-violet/90 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};
