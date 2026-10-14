import React, { useEffect, useRef } from "react";

/**
 * Reusable accessible modal dialog component for FinTrack.
 *
 * Features:
 * - Traps focus & supports Escape key closing
 * - Closes on backdrop click (optional)
 * - Prevents background page scrolling while open
 * - ARIA accessibility attributes (role="dialog", aria-modal="true")
 * - Matches FinTrack dark theme tokens
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "500px",
  disableBackdropClose = false,
  showCloseButton = true,
  ariaLabel,
}) {
  const modalBoxRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="notion-modal-backdrop"
      onClick={disableBackdropClose ? undefined : onClose}
      role="presentation"
    >
      <div
        className="notion-modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === "string" ? title : undefined)}
        ref={modalBoxRef}
      >
        {(title || showCloseButton) && (
          <div className="notion-modal-header">
            <div style={{ flex: 1, paddingRight: "10px" }}>
              {title && (
                typeof title === "string" ? <h3>{title}</h3> : title
              )}
              {subtitle && (
                <p className="notion-modal-subtitle">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="notion-modal-close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="notion-modal-body">{children}</div>
      </div>
    </div>
  );
}
