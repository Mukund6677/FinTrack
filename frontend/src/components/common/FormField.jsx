import React from "react";

/**
 * Reusable FormField component providing consistent label, required indicators,
 * helper hints, and accessible inline validation error messages.
 */
export default function FormField({
  label,
  id,
  error,
  hint,
  required = false,
  children,
  className = "",
  style,
}) {
  return (
    <div className={`form-field-group ${className}`} style={style}>
      {label && (
        <label htmlFor={id} className="form-field-label">
          {label}
          {required && (
            <span className="form-field-required" aria-hidden="true">
              {" "}*
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && <span className="form-field-hint">{hint}</span>}
      {error && (
        <span id={id ? `${id}-error` : undefined} className="form-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
