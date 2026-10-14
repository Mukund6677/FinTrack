import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import FormField from "../common/FormField";

/**
 * In-app form modal for recording a split bill participant settlement.
 * Replaces the browser window.prompt() for payment amounts.
 */
export default function RecordSettlementModal({
  isOpen,
  bill,
  participant,
  onClose,
  onSuccess,
  apiUrl,
  token,
}) {
  const [amount, setAmount] = useState("");
  const [settlementDate, setSettlementDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const share = Number(participant?.share_amount) || 0;
  const paid = Number(participant?.amount_paid) || 0;
  const outstanding = Math.max(0, share - paid);

  useEffect(() => {
    if (participant && isOpen) {
      const outstandingBal = Math.max(
        0,
        Number(participant.share_amount || 0) - Number(participant.amount_paid || 0)
      );
      setAmount(outstandingBal > 0 ? String(outstandingBal) : "");
      setSettlementDate(new Date().toISOString().slice(0, 10));
      setErrors({});
      setApiError("");
    }
  }, [participant, isOpen]);

  if (!isOpen || !bill || !participant) return null;

  const validate = () => {
    const newErrors = {};

    if (!amount || amount.trim() === "") {
      newErrors.amount = "Please enter the settlement amount.";
    } else {
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) {
        newErrors.amount = "Amount must be a valid number greater than zero.";
      }
    }

    if (!settlementDate) {
      newErrors.settlementDate = "Please choose a settlement date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);
    const numAmount = Number(amount);

    try {
      const response = await fetch(
        `${apiUrl}/split-bills/${bill.split_bill_id}/settlements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participant_id: participant.participant_id,
            amount: numAmount,
            settlement_date: settlementDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to record settlement");
      }

      onSuccess(
        `Payment of ₹${numAmount.toLocaleString("en-IN")} recorded. Outstanding balance: ₹${Number(
          data.outstanding_amount ?? 0
        ).toLocaleString("en-IN")}`
      );
      onClose();
    } catch (err) {
      setApiError(err.message || "Failed to record settlement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title="Record Participant Settlement"
      subtitle={`Bill: ${bill.title}`}
      maxWidth="480px"
      disableBackdropClose={loading}
      showCloseButton={!loading}
    >
      <div className="allocation-context-card">
        <div className="allocation-context-row">
          <span className="allocation-context-label">Participant:</span>
          <span className="allocation-context-value font-bold">{participant.name}</span>
        </div>
        <div className="allocation-context-row">
          <span className="allocation-context-label">Total Share:</span>
          <span className="allocation-context-value font-mono">₹{share.toLocaleString("en-IN")}</span>
        </div>
        <div className="allocation-context-row">
          <span className="allocation-context-label">Already Paid:</span>
          <span className="allocation-context-value font-mono">₹{paid.toLocaleString("en-IN")}</span>
        </div>
        <div className="allocation-context-row">
          <span className="allocation-context-label">Outstanding Balance:</span>
          <span
            className="allocation-context-value font-mono font-bold"
            style={{ color: outstanding > 0 ? "var(--danger-text)" : "var(--success-text)" }}
          >
            ₹{outstanding.toLocaleString("en-IN")}
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
          label="Payment Amount (₹)"
          id="settlement-amount"
          required
          error={errors.amount}
          hint={
            outstanding > 0 ? (
              <button
                type="button"
                className="inline-link-btn"
                onClick={() => {
                  setAmount(String(outstanding));
                  if (errors.amount) setErrors({ ...errors, amount: null });
                }}
              >
                Set to full outstanding (₹{outstanding.toLocaleString("en-IN")})
              </button>
            ) : null
          }
        >
          <input
            id="settlement-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors({ ...errors, amount: null });
            }}
            disabled={loading}
            required
            className={errors.amount ? "has-error" : ""}
          />
        </FormField>

        <FormField
          label="Settlement Date"
          id="settlement-date"
          required
          error={errors.settlementDate}
          hint="Date on which this payment was completed"
        >
          <input
            id="settlement-date"
            type="date"
            value={settlementDate}
            onChange={(e) => {
              setSettlementDate(e.target.value);
              if (errors.settlementDate) {
                setErrors({ ...errors, settlementDate: null });
              }
            }}
            disabled={loading}
            required
            className={errors.settlementDate ? "has-error" : ""}
          />
        </FormField>

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
            {loading ? "Recording Payment..." : "Record Payment"}
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
