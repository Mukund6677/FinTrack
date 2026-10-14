import React from "react";
import Modal from "./Modal";

/**
 * Reusable Confirmation Dialog for destructive or important actions.
 * Replaces window.confirm() across the entire application.
 */
export default function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  isLoading = false,
  icon = "⚠️",
}) {
  const isDanger = variant === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onCancel}
      title={title}
      maxWidth="440px"
      disableBackdropClose={isLoading}
      showCloseButton={!isLoading}
    >
      <div className="confirm-dialog-content">
        {icon && <div className="confirm-dialog-icon" aria-hidden="true">{icon}</div>}
        <div className="confirm-dialog-message">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>
      </div>

      <div className="notion-modal-actions" style={{ marginTop: "22px" }}>
        <button
          type="button"
          className={isDanger ? "notion-btn-danger" : "notion-btn-primary"}
          onClick={onConfirm}
          disabled={isLoading}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isLoading && <span className="btn-spinner" aria-hidden="true" />}
          {isLoading ? "Processing..." : confirmText}
        </button>
        <button
          type="button"
          className="notion-btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
}
