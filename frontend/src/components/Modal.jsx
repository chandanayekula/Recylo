import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, icon: Icon, children, footer }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icon && <Icon size={20} className="text-success" style={{ color: 'var(--color-accent)' }} />}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="icon-button"
            style={{ width: 32, height: 32, border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-content">
          {children}
        </div>

        {footer && (
          <div className="modal-footer-bar">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
