import React, { useEffect } from "react";

/**
 * Modern floating Toast notification component for FinTrack.
 *
 * Supports types: "success", "error", "warning", "info".
 * Matches FinTrack theme tokens with glassmorphic borders and status accents.
 */
export function ToastItem({ toast, onDismiss }) {
  const { id, type = "info", message, duration = 4500 } = toast;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠️";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <div className={`toast-notification toast-${type}`} role="alert">
      <div className="toast-icon-wrap" aria-hidden="true">
        {getIcon()}
      </div>
      <div className="toast-message-content">
        <p>{message}</p>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
}
