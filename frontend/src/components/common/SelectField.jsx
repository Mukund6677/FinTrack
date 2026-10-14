import React from "react";
import FormField from "./FormField";

/**
 * Reusable SelectField component using native HTML <select> styled with FinTrack's design system.
 */
export default function SelectField({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  disabled = false,
  error,
  hint,
  children,
  className = "",
  style,
}) {
  return (
    <FormField
      label={label}
      id={id}
      error={error}
      hint={hint}
      required={required}
      className={className}
      style={style}
    >
      <select
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={`form-field-select ${error ? "has-error" : ""}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.length > 0
          ? options.map((opt) => {
              const optVal = typeof opt === "object" ? opt.value : opt;
              const optLabel = typeof opt === "object" ? opt.label : opt;
              return (
                <option key={optVal} value={optVal}>
                  {optLabel}
                </option>
              );
            })
          : children}
      </select>
    </FormField>
  );
}
