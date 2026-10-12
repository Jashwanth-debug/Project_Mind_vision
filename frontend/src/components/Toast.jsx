import React from 'react';

export default function Toast({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="toast-container">
      <div className="clinical-toast" onClick={onDismiss}>
        <span style={{ color: 'var(--accent-teal)', fontSize: '1.1rem' }}>✓</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
