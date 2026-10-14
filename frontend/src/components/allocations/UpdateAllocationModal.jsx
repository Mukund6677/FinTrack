import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import FormField from "../common/FormField";
import SelectField from "../common/SelectField";

const VALID_STATUSES = [
  { value: "PENDING", label: "PENDING" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

/**
 * In-app form modal for updating an Income Allocation.
 * Replaces the sequential browser window.prompt() dialogs.
 */
export default function UpdateAllocationModal({
  isOpen,
  allocation,
  onClose,
  onSuccess,
  apiUrl,
  token,
}) {
  const [actualAmount, setActualAmount] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  // Prepopulate form whenever allocation changes or modal opens
  useEffect(() => {
    if (allocation) {
      setActualAmount(
        allocation.actual_amount !== undefined && allocation.actual_amount !== null
          ? String(allocation.actual_amount)
          : "0"
      );
      setStatus(allocation.status || "PENDING");
      setErrors({});
      setApiError("");
    }
  }, [allocation, isOpen]);

  if (!isOpen || !allocation) return null;

  const validate = () => {
    const newErrors = {};

    if (actualAmount === "" || actualAmount === null || actualAmount === undefined) {
      newErrors.actualAmount = "Please enter the actual amount spent.";
    } else {
      const num = Number(actualAmount);
      if (!Number.isFinite(num)) {
        newErrors.actualAmount = "Enter a valid numeric amount.";
      } else if (num < 0) {
        newErrors.actualAmount = "Actual amount cannot be negative.";
      }
    }

    if (!VALID_STATUSES.some((s) => s.value === status)) {
      newErrors.status = "Please select a valid allocation status.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);
    const numAmount = Number(actualAmount);

    try {
      const params = new URLSearchParams({
        actual_amount: String(numAmount),
        status,
      });

      const response = await fetch(
        `${apiUrl}/allocations/${allocation.allocation_id}?${params}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to update allocation."
        );
      }

      onSuccess("Allocation updated successfully.");
      onClose();
    } catch (err) {
      setApiError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const planned = Number(allocation.planned_amount) || 0;
  const currentActual = Number(actualAmount) || 0;
  const remaining = planned - currentActual;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title="Update Income Allocation"
      subtitle={`Allocation for: ${allocation.title || "Untitled"}`}
      maxWidth="480px"
      disableBackdropClose={loading}
      showCloseButton={!loading}
    >
      <div className="allocation-context-card">
        <div className="allocation-context-row">
          <span className="allocation-context-label">Category:</span>
          <span className="allocation-context-value">{allocation.category || "Uncategorized"}</span>
        </div>
        <div className="allocation-context-row">
          <span className="allocation-context-label">Planned Amount:</span>
          <span className="allocation-context-value font-mono">₹{planned.toLocaleString("en-IN")}</span>
        </div>
        <div className="allocation-context-row">
          <span className="allocation-context-label">Remaining:</span>
          <span
            className="allocation-context-value font-mono"
            style={{ color: remaining < 0 ? "var(--danger-text)" : "var(--success-text)" }}
          >
            ₹{remaining.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {apiError && (
        <div className="form-alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Actual Amount Spent (₹)"
          id="allocation-actual-amount"
          required
          error={errors.actualAmount}
          hint="Total amount spent against this allocation plan"
        >
          <input
            id="allocation-actual-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={actualAmount}
            onChange={(e) => {
              setActualAmount(e.target.value);
              if (errors.actualAmount) {
                setErrors({ ...errors, actualAmount: null });
              }
            }}
            disabled={loading}
            required
            className={errors.actualAmount ? "has-error" : ""}
          />
        </FormField>

        <SelectField
          label="Allocation Status"
          id="allocation-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            if (errors.status) {
              setErrors({ ...errors, status: null });
            }
          }}
          options={VALID_STATUSES}
          disabled={loading}
          required
          error={errors.status}
          hint="Select the current progress of this allocation"
        />

        <div className="notion-modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="submit"
            className="notion-btn-primary"
            disabled={loading}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="notion-btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
