import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || !toasts.length) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        const Icon = type === 'success' ? CheckCircle2 :
                     type === 'error' ? AlertCircle :
                     type === 'warning' ? AlertTriangle : Info;

        const iconColor = type === 'success' ? '#16a34a' :
                          type === 'error' ? '#dc2626' :
                          type === 'warning' ? '#d97706' : '#2563eb';

        return (
          <div key={toast.id} className={`toast-item ${type}`}>
            <Icon size={20} style={{ color: iconColor, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'transparent', border: 'none', color: '#9cb5a6', cursor: 'pointer', padding: 2 }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
