import React, { useState, useEffect } from 'react';
import { useStore, type TaskCategory } from '../store';

const TOTAL_CELLS = 24;

export const NewTaskModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTile, tasks, addToast } = useStore();
  const [title, setTitle] = useState('');
  const [size, setSize] = useState({ w: 2, h: 2 });
  const [cat, setCat] = useState<TaskCategory>('focus');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSize({ w: 2, h: 2 });
      setCat('focus');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) {
      addToast('Give it a title first', '⚠');
      return;
    }

    const occupiedCells = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.parked ? 1 : t.w * t.h), 0);
    const need = size.w * size.h;
    
    if (occupiedCells + need > TOTAL_CELLS) {
      addToast('Not enough grid space for that size', '⚠');
      return;
    }

    addTile(title.trim(), cat, size.w, size.h);
    onClose();
  };

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New block</h3>
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            placeholder="e.g. Refactor auth middleware"
            maxLength={80}
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
        </div>
        <div className="field">
          <label>Cognitive weight (size)</label>
          <div className="option-row">
            <div className={`option-pill ${size.w === 1 && size.h === 1 ? 'selected' : ''}`} onClick={() => setSize({ w: 1, h: 1 })}>
              1×1<br /><span style={{ opacity: 0.6 }}>micro</span>
            </div>
            <div className={`option-pill ${size.w === 2 && size.h === 1 ? 'selected' : ''}`} onClick={() => setSize({ w: 2, h: 1 })}>
              2×1<br /><span style={{ opacity: 0.6 }}>standard</span>
            </div>
            <div className={`option-pill ${size.w === 2 && size.h === 2 ? 'selected' : ''}`} onClick={() => setSize({ w: 2, h: 2 })}>
              2×2<br /><span style={{ opacity: 0.6 }}>focus</span>
            </div>
            <div className={`option-pill ${size.w === 3 && size.h === 2 ? 'selected' : ''}`} onClick={() => setSize({ w: 3, h: 2 })}>
              3×2<br /><span style={{ opacity: 0.6 }}>deep</span>
            </div>
          </div>
        </div>
        <div className="field">
          <label>Category</label>
          <div className="option-row">
            <div className={`option-pill ${cat === 'focus' ? 'selected' : ''}`} onClick={() => setCat('focus')}>Deep Work</div>
            <div className={`option-pill ${cat === 'fire' ? 'selected' : ''}`} onClick={() => setCat('fire')}>Firefighter</div>
            <div className={`option-pill ${cat === 'admin' ? 'selected' : ''}`} onClick={() => setCat('admin')}>Admin</div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create block</button>
        </div>
      </div>
    </div>
  );
};
