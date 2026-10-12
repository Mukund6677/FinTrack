import { useState, useEffect } from "react";

export default function FinancialReports({ API_URL, token, initialStartDate = "", initialEndDate = "" }) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (start = startDate, end = endDate) => {
    if (!token) return;
    setLoading(true);
    try {
      let url = `${API_URL}/reports/financial-summary`;
      const params = new URLSearchParams();
      if (start) params.append("start_date", start);
      if (end) params.append("end_date", end);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(startDate, endDate);
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-section">
      <div className="report-header-banner">
        <div>
          <h2>Executive Financial Statement</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Comprehensive report of cash flows, personal split shares, budget tracking & card rewards
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }} className="print-hide">
          <button
            className="notion-btn-secondary"
            onClick={handlePrint}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}
          >
            <span>🖨️</span> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* DATE FILTER FOR REPORT */}
      <div className="date-filter print-hide" style={{ padding: "15px", marginBottom: "20px" }}>
        <div className="date-filter-controls">
          <div>
            <label>Report Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label>Report End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="notion-btn-primary" onClick={() => fetchReport(startDate, endDate)}>
            Generate Statement
          </button>
          {(startDate || endDate) && (
            <button
              className="notion-btn-secondary"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                fetchReport("", "");
              }}
            >
              Reset Period
            </button>
          )}
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Generating financial statement...</p>}

      {report && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "13px", color: "var(--text-muted)", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "10px" }}>
            <span><strong>Client:</strong> {report.user_name}</span>
            <span><strong>Statement Period:</strong> {report.filter.start_date || "All Time"} to {report.filter.end_date || "Present"}</span>
            <span><strong>Generated:</strong> {new Date().toLocaleDateString()}</span>
          </div>

          {/* KPI STATS */}
          <div className="report-stat-grid">
            <div className="report-stat-card" style={{ borderLeftColor: "var(--success-base)" }}>
              <h4>Total Inflow (Income)</h4>
              <p style={{ color: "var(--success-text)" }}>₹{report.summary.total_income.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="report-stat-card" style={{ borderLeftColor: "var(--danger-base)" }}>
              <h4>Total Direct Outflow (Expenses)</h4>
              <p style={{ color: "var(--danger-text)" }}>₹{report.summary.total_direct_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="report-stat-card" style={{ borderLeftColor: "var(--primary-base)" }}>
              <h4>Net Cash Surplus / Savings</h4>
              <p style={{ color: report.summary.net_savings >= 0 ? "var(--success-text)" : "var(--danger-text)" }}>
                ₹{report.summary.net_savings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="report-stat-card" style={{ borderLeftColor: "var(--warning-base)" }}>
              <h4>Savings Rate</h4>
              <p style={{ color: "var(--warning-text)" }}>{report.summary.savings_rate_percent.toFixed(1)}%</p>
            </div>
            <div className="report-stat-card" style={{ borderLeftColor: "var(--info-base)" }}>
              <h4>Personal Split-Bill Share</h4>
              <p>₹{report.summary.split_bill_personal_share.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Paid: ₹{report.summary.split_bill_share_paid.toFixed(2)} | Outstanding: ₹{report.summary.split_bill_share_outstanding.toFixed(2)}
              </div>
            </div>
            <div className="report-stat-card" style={{ borderLeftColor: "var(--success-base)" }}>
              <h4>Card Benefits Earned</h4>
              <p style={{ color: "var(--success-text)" }}>₹{report.summary.total_card_benefits_received.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Total rewards / cashbacks tracked
              </div>
            </div>
          </div>

          {/* CATEGORY BREAKDOWN */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>1. Expense Distribution by Category</h3>
            {report.category_breakdown.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No recorded expenses for this period.</p>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Spent</th>
                    <th>Share of Total Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {report.category_breakdown.map((cat, i) => (
                    <tr key={i}>
                      <td><strong>{cat.category}</strong></td>
                      <td>₹{cat.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ flex: 1, height: "6px", background: "var(--border-default)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, cat.percentage)}%`, height: "100%", background: "var(--primary-base)" }}></div>
                          </div>
                          <span style={{ fontSize: "12px", width: "45px", fontWeight: "600" }}>{cat.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* BUDGET PERFORMANCE */}
          <div style={{ marginTop: "35px" }}>
            <h3 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>2. Budget Discipline & Limit Tracking</h3>
            {report.budget_performance.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No active category budgets configured.</p>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Budget Category</th>
                    <th>Period</th>
                    <th>Configured Limit</th>
                    <th>Actual Spent</th>
                    <th>Variance / Remaining</th>
                    <th>Utilization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.budget_performance.map((b, i) => (
                    <tr key={i}>
                      <td><strong>{b.category}</strong></td>
                      <td>{b.period}</td>
                      <td>₹{b.limit_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td>₹{b.spent_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: b.remaining >= 0 ? "var(--success-text)" : "var(--danger-text)", fontWeight: "600" }}>
                        {b.remaining >= 0 ? `+₹${b.remaining.toFixed(2)}` : `-₹${Math.abs(b.remaining).toFixed(2)}`}
                      </td>
                      <td>{b.percentage_used}%</td>
                      <td>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: b.is_over_budget ? "var(--danger-subtle)" : b.percentage_used >= 80 ? "var(--warning-subtle)" : "var(--success-subtle)",
                          color: b.is_over_budget ? "var(--danger-text)" : b.percentage_used >= 80 ? "var(--warning-text)" : "var(--success-text)"
                        }}>
                          {b.is_over_budget ? "OVER BUDGET" : b.percentage_used >= 80 ? "NEAR LIMIT" : "ON TRACK"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ALLOCATIONS & SPLIT SUMMARY */}
          <div style={{ marginTop: "35px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            <div style={{ background: "var(--bg-surface-elevated)", padding: "18px", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
              <h4 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Income Allocations Summary</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                Total Planned Targets: <strong>₹{report.summary.total_planned_allocations.toFixed(2)}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                Completed Targets: <strong>₹{report.summary.total_completed_allocations.toFixed(2)}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                Pending Target Goals: <strong>{report.summary.pending_allocations_count}</strong>
              </p>
            </div>

            <div style={{ background: "var(--bg-surface-elevated)", padding: "18px", borderRadius: "10px", border: "1px solid var(--border-default)" }}>
              <h4 style={{ marginBottom: "10px", color: "var(--text-primary)" }}>Split-Bills Shared Balances</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                Total Bills Created: <strong>₹{report.summary.total_bills_created_amount.toFixed(2)}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                Your Assigned Share: <strong>₹{report.summary.split_bill_personal_share.toFixed(2)}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0" }}>
                Your Outstanding Share to Settle: <strong>₹{report.summary.split_bill_share_outstanding.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          {/* FOOTER AUDIT NOTICE */}
          <div style={{ marginTop: "30px", borderTop: "1px solid var(--border-subtle)", paddingTop: "15px", fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
            FinTrack Financial Management System • All calculations use exact decimal arithmetic • Non-duplicative split shares accounting
          </div>
        </div>
      )}
    </div>
  );
}
