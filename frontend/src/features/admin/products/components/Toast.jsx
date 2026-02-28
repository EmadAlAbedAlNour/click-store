import React from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`ui-toast ${type === 'error' ? 'ui-toast-error' : 'ui-toast-success'}`}>
      <div className="flex-1 font-medium">{message}</div>
      <button
        onClick={onClose}
        className="ui-btn ui-btn-ghost ui-btn-icon-sm text-white/85 hover:text-white hover:bg-black/10"
      >
        x
      </button>
    </div>
  );
}
