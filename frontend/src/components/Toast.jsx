import React from 'react';
import { IconCheck, IconX, IconAlertCircle } from './Icons';

export default function Toast({ message, onDismiss }) {
  if (!message) return null;

  const isUrgent = message.includes('🚨') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('error');

  return (
    <div
      className="mv-toast-region"
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        className="mv-toast"
        role="status"
        style={{
          borderColor: isUrgent ? 'var(--status-severe-border)' : 'var(--border-color)',
          background: isUrgent ? 'var(--status-severe-bg)' : 'var(--card-bg-elevated)'
        }}
      >
        <span style={{
          color: isUrgent ? 'var(--status-severe-dot)' : 'var(--accent-teal)',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          {isUrgent ? <IconAlertCircle size={18} /> : <IconCheck size={18} />}
        </span>
        <span style={{
          flex: 1,
          color: isUrgent ? 'var(--status-severe-text)' : 'var(--text-primary)',
          fontWeight: 500
        }}>
          {message}
        </span>
        {onDismiss && (
          <button
            type="button"
            className="mv-icon-btn"
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              padding: 0
            }}
            onClick={onDismiss}
            aria-label="Dismiss notification"
          >
            <IconX size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
