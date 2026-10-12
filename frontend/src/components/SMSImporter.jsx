import { useState } from "react";

export default function SMSImporter({ API_URL, token, onTransactionAdded }) {
  const [smsText, setSmsText] = useState("");
  const [parsedResult, setParsedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const samples = [
    {
      label: "🍔 Swiggy UPI Debit",
      text: "Rs. 450.00 debited from A/C **1234 on 08-10-2026 at SWIGGY via UPI. Avl Bal: Rs 14,200."
    },
    {
      label: "📦 Amazon Card Debit",
      text: "Your Credit Card ending 4321 was charged INR 1,299.00 at AMAZON INDIA on 09-10-2026. Avl Lmt: Rs 75,000."
    },
    {
      label: "💰 Salary Credit",
      text: "INR 50,000.00 credited to your A/C **5678 on 01-10-2026 by SALARY ACME CORP. Ref No: 987654321."
    },
    {
      label: "⛽ Petrol Fuel Debit",
      text: "Rs. 850.00 spent on your Card ending 4321 at INDIAN OIL CORP on 10-10-2026. Fuel Surcharge waiver applicable."
    }
  ];

  const handleParse = async (textToParse = smsText) => {
    const text = (textToParse || smsText).trim();
    if (!text || !token) return;

    setLoading(true);
    setStatusMsg("");
    setParsedResult(null);

    try {
      const res = await fetch(`${API_URL}/sms/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sms_text: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to parse SMS");

      setParsedResult(data);
    } catch (err) {
      setStatusMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult || !token) return;
    const p = parsedResult.parsed_data;

    setConfirmLoading(true);
    setStatusMsg("");

    try {
      const res = await fetch(`${API_URL}/sms/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_type: p.transaction_type,
          amount: p.amount,
          category_or_source: p.category,
          transaction_date: p.transaction_date,
          merchant: p.merchant,
          description: p.description,
          payment_method: p.payment_method
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save transaction");

      setStatusMsg(`✅ Successfully imported ${p.transaction_type} of ₹${p.amount.toFixed(2)} for ${p.merchant}!`);
      setParsedResult(null);
      setSmsText("");
      if (onTransactionAdded) onTransactionAdded();
    } catch (err) {
      setStatusMsg(`❌ ${err.message}`);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="sms-section">
      <div className="section-header">
        <div>
          <h2>Android Bank SMS Transaction Importer</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Automated SMS parsing with idempotency, privacy safeguards, and zero double-counting
          </p>
        </div>
      </div>

      {/* ARCHITECTURE NOTICE */}
      <div className="sms-banner">
        <strong>📱 Mobile Integration Note:</strong> Modern web browser security standards strictly restrict web applications from reading device SMS inboxes directly. In native Android implementations, background SMS monitoring requires explicit runtime <code>RECEIVE_SMS</code> permissions and local BroadcastReceivers. FinTrack implements this production-safe, validated parsing workflow that ingests bank notification payloads securely without accessing confidential inbox messages.
      </div>

      {/* QUICK SAMPLES */}
      <div style={{ marginBottom: "15px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
          One-Click Test Samples:
        </span>
        <div className="chip-row">
          {samples.map((s, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => {
                setSmsText(s.text);
                handleParse(s.text);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT FORM */}
      <div style={{ marginTop: "15px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px", color: "var(--text-secondary)" }}>
          Paste Bank SMS Message
        </label>
        <textarea
          rows="3"
          placeholder="Paste or type SMS here (e.g. 'Rs. 450.00 debited from A/C **1234 on 08-10-2026 at SWIGGY...')"
          value={smsText}
          onChange={e => setSmsText(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid var(--border-default)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none"
          }}
        />
        <div style={{ marginTop: "10px" }}>
          <button
            className="notion-btn-primary"
            onClick={() => handleParse()}
            disabled={loading || !smsText.trim()}
            style={{
              padding: "10px 20px",
              opacity: (loading || !smsText.trim()) ? 0.6 : 1,
              cursor: (loading || !smsText.trim()) ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Analyzing..." : "Analyze & Extract Transaction"}
          </button>
        </div>
      </div>

      {statusMsg && <p className="message" style={{ margin: "15px 0" }}>{statusMsg}</p>}

      {/* PARSED PREVIEW CARD */}
      {parsedResult && (
        <div className="preview-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Detected Transaction Details</h3>
            <span style={{
              background: parsedResult.parsed_data.transaction_type === "EXPENSE" ? "var(--danger-subtle)" : "var(--success-subtle)",
              color: parsedResult.parsed_data.transaction_type === "EXPENSE" ? "var(--danger-text)" : "var(--success-text)",
              border: parsedResult.parsed_data.transaction_type === "EXPENSE" ? "1px solid var(--danger-border)" : "1px solid var(--success-border)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "12px"
            }}>
              {parsedResult.parsed_data.transaction_type}
            </span>
          </div>

          {/* DUPLICATE WARNING */}
          {parsedResult.is_duplicate && (
            <div className="duplicate-alert">
              ⚠️ <strong>Potential Duplicate Detected:</strong> {parsedResult.duplicate_warning}.
              Review before confirming to prevent double-counting.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>AMOUNT</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>
                ₹{parsedResult.parsed_data.amount.toFixed(2)}
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>MERCHANT / BENEFICIARY</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                {parsedResult.parsed_data.merchant}
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>ASSIGNED CATEGORY</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--primary-text)" }}>
                {parsedResult.parsed_data.category}
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>TRANSACTION DATE</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                {parsedResult.parsed_data.transaction_date}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="notion-btn-income"
              onClick={handleConfirm}
              disabled={confirmLoading}
              style={{ flex: 1 }}
            >
              {confirmLoading ? "Saving to MySQL..." : "Confirm & Save Transaction to FinTrack"}
            </button>
            <button
              className="notion-btn-secondary"
              onClick={() => setParsedResult(null)}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
