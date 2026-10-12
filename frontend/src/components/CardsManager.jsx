import { useState, useEffect } from "react";

export default function CardsManager({ API_URL, token, expenses = [] }) {
  const [cards, setCards] = useState([]);
  const [usages, setUsages] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [recCategory, setRecCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    card_name: "",
    issuer: "",
    card_type: "CREDIT",
    network: "Visa",
    last_four_digits: "",
    expiry_month: "",
    expiry_year: ""
  });

  const [activeCardForBenefit, setActiveCardForBenefit] = useState(null);
  const [benefitForm, setBenefitForm] = useState({
    category: "Dining",
    benefit_type: "Cashback",
    benefit_value: "",
    conditions: ""
  });

  const [activeCardForUsage, setActiveCardForUsage] = useState(null);
  const [usageForm, setUsageForm] = useState({
    expense_id: "",
    benefit_received: ""
  });

  const [cardBenefitsMap, setCardBenefitsMap] = useState({});

  const fetchCards = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data);
        // Fetch benefits for each card
        data.forEach(c => fetchBenefitsForCard(c.card_id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBenefitsForCard = async (cardId) => {
    try {
      const res = await fetch(`${API_URL}/cards/${cardId}/benefits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const b = await res.json();
        setCardBenefitsMap(prev => ({ ...prev, [cardId]: b }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/cards-usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async (category = "") => {
    if (!token) return;
    try {
      const url = category
        ? `${API_URL}/cards-recommendations?category=${encodeURIComponent(category)}`
        : `${API_URL}/cards-recommendations`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchUsages();
    fetchRecommendations();
  }, [token]);

  const handleCreateCard = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const payload = {
        card_name: cardForm.card_name,
        issuer: cardForm.issuer,
        card_type: cardForm.card_type,
        network: cardForm.network || null,
        last_four_digits: cardForm.last_four_digits || null,
        expiry_month: cardForm.expiry_month ? parseInt(cardForm.expiry_month) : null,
        expiry_year: cardForm.expiry_year ? parseInt(cardForm.expiry_year) : null
      };

      const res = await fetch(`${API_URL}/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create card");

      setMsg("✅ Card added successfully!");
      setShowAddCard(false);
      setCardForm({
        card_name: "",
        issuer: "",
        card_type: "CREDIT",
        network: "Visa",
        last_four_digits: "",
        expiry_month: "",
        expiry_year: ""
      });
      fetchCards();
      fetchRecommendations();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this card and its associated records?")) return;
    try {
      const res = await fetch(`${API_URL}/cards/${cardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg("Card deleted successfully");
        fetchCards();
        fetchUsages();
        fetchRecommendations();
      }
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleAddBenefit = async (e) => {
    e.preventDefault();
    if (!activeCardForBenefit) return;
    try {
      const payload = {
        category: benefitForm.category,
        benefit_type: benefitForm.benefit_type,
        benefit_value: parseFloat(benefitForm.benefit_value),
        conditions: benefitForm.conditions || null
      };
      const res = await fetch(`${API_URL}/cards/${activeCardForBenefit.card_id}/benefits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add benefit");

      setMsg("✅ Benefit added to card!");
      setActiveCardForBenefit(null);
      setBenefitForm({ category: "Dining", benefit_type: "Cashback", benefit_value: "", conditions: "" });
      fetchBenefitsForCard(activeCardForBenefit.card_id);
      fetchRecommendations();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  const handleRecordUsage = async (e) => {
    e.preventDefault();
    if (!activeCardForUsage) return;
    try {
      const payload = {
        expense_id: parseInt(usageForm.expense_id),
        benefit_received: usageForm.benefit_received ? parseFloat(usageForm.benefit_received) : 0.0
      };
      const res = await fetch(`${API_URL}/cards/${activeCardForUsage.card_id}/usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to record usage");

      setMsg("✅ Card usage recorded successfully!");
      setActiveCardForUsage(null);
      setUsageForm({ expense_id: "", benefit_received: "" });
      fetchUsages();
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  return (
    <div className="cards-section">
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Payment Cards & Rewards</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Manage credit/debit cards, cashback terms, and usage benefits</p>
        </div>
        <button
          className="notion-btn-primary"
          onClick={() => setShowAddCard(!showAddCard)}
        >
          {showAddCard ? "Close Form" : "+ Add New Card"}
        </button>
      </div>

      {msg && <p className="message" style={{ margin: "15px 0" }}>{msg}</p>}

      {/* ADD CARD FORM */}
      {showAddCard && (
        <div style={{ background: "var(--bg-surface-elevated)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-default)", marginTop: "15px" }}>
          <h3>Add Payment Card</h3>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "15px" }}>
            🔒 Security Notice: For your security, only enter card nickname, issuer, and last 4 digits. Never enter complete card numbers, CVVs, or PINs.
          </p>
          <form onSubmit={handleCreateCard} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Card Nickname</label>
              <input
                type="text"
                placeholder="e.g. HDFC Millennia"
                value={cardForm.card_name}
                onChange={e => setCardForm({ ...cardForm, card_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Bank / Issuer</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, ICICI, SBI"
                value={cardForm.issuer}
                onChange={e => setCardForm({ ...cardForm, issuer: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Card Type</label>
              <select
                value={cardForm.card_type}
                onChange={e => setCardForm({ ...cardForm, card_type: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)" }}
              >
                <option value="CREDIT">Credit Card</option>
                <option value="DEBIT">Debit Card</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Payment Network</label>
              <input
                type="text"
                placeholder="Visa, Mastercard, RuPay"
                value={cardForm.network}
                onChange={e => setCardForm({ ...cardForm, network: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Last 4 Digits</label>
              <input
                type="text"
                maxLength="4"
                pattern="\d{4}"
                placeholder="e.g. 5432"
                value={cardForm.last_four_digits}
                onChange={e => setCardForm({ ...cardForm, last_four_digits: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Expiry Month (1-12)</label>
              <input
                type="number"
                min="1"
                max="12"
                placeholder="MM"
                value={cardForm.expiry_month}
                onChange={e => setCardForm({ ...cardForm, expiry_month: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-secondary)" }}>Expiry Year</label>
              <input
                type="number"
                min="2020"
                max="2040"
                placeholder="YYYY"
                value={cardForm.expiry_year}
                onChange={e => setCardForm({ ...cardForm, expiry_year: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" className="notion-btn-primary" style={{ width: "100%", padding: "11px" }}>
                Save Card
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CARDS LIST */}
      <div className="cards-grid">
        {cards.length === 0 ? (
          <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "30px" }}>
            No payment cards added yet. Click "+ Add New Card" above to register your first card.
          </p>
        ) : (
          cards.map(card => {
            const benefits = cardBenefitsMap[card.card_id] || [];
            return (
              <div key={card.card_id} className="card-item">
                <div className={`card-visual ${card.card_type.toLowerCase()}`}>
                  <div className="card-header-visual">
                    <span>{card.issuer}</span>
                    <span>{card.card_type}</span>
                  </div>
                  <div className="card-number">
                    •••• •••• •••• {card.last_four_digits || "XXXX"}
                  </div>
                  <div className="card-footer-visual">
                    <div>
                      <div style={{ fontSize: "10px", opacity: 0.7 }}>CARDHOLDER</div>
                      <div style={{ fontWeight: 600 }}>{card.card_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", opacity: 0.7 }}>EXPIRES</div>
                      <div style={{ fontWeight: 600 }}>
                        {card.expiry_month && card.expiry_year ? `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}` : "--/--"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-benefits-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>CONFIGURED BENEFITS</span>
                    <button
                      className="card-btn"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                      onClick={() => setActiveCardForBenefit(card)}
                    >
                      + Add Benefit
                    </button>
                  </div>
                  {benefits.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No benefits configured yet</span>
                  ) : (
                    <div>
                      {benefits.map(b => (
                        <span key={b.benefit_id} className="benefit-badge" title={b.conditions || "No conditions"}>
                          {b.category}: {b.benefit_value}% {b.benefit_type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-btn-row">
                  <button
                    className="card-btn primary"
                    style={{ flex: 1 }}
                    onClick={() => setActiveCardForUsage(card)}
                  >
                    Record Usage
                  </button>
                  <button
                    className="card-btn danger"
                    onClick={() => handleDeleteCard(card.card_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD BENEFIT */}
      {activeCardForBenefit && (
        <div className="notion-modal-backdrop">
          <div className="notion-modal-box">
            <div className="notion-modal-header">
              <h3>Add Benefit to {activeCardForBenefit.card_name}</h3>
              <button className="notion-modal-close" onClick={() => setActiveCardForBenefit(null)}>✕</button>
            </div>
            <form onSubmit={handleAddBenefit}>
              <div>
                <label>Spending Category</label>
                <input
                  type="text"
                  placeholder="e.g. Dining, Travel, Groceries, Fuel, Shopping"
                  value={benefitForm.category}
                  onChange={e => setBenefitForm({ ...benefitForm, category: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Benefit Type</label>
                <select
                  value={benefitForm.benefit_type}
                  onChange={e => setBenefitForm({ ...benefitForm, benefit_type: e.target.value })}
                >
                  <option value="Cashback">Cashback (%)</option>
                  <option value="Points">Reward Points multiplier (x)</option>
                  <option value="Fuel Surcharge Waiver">Fuel Surcharge Waiver (%)</option>
                  <option value="Discount">Instant Discount (%)</option>
                </select>
              </div>
              <div>
                <label>Benefit Value</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0 for 5% cashback or 10x points"
                  value={benefitForm.benefit_value}
                  onChange={e => setBenefitForm({ ...benefitForm, benefit_value: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Terms / Conditions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Max ₹500/month, Min spend ₹1000"
                  value={benefitForm.conditions}
                  onChange={e => setBenefitForm({ ...benefitForm, conditions: e.target.value })}
                />
              </div>
              <div className="notion-modal-actions">
                <button type="submit" className="notion-btn-primary" style={{ flex: 1 }}>
                  Save Benefit
                </button>
                <button type="button" className="notion-btn-secondary" style={{ flex: 1 }} onClick={() => setActiveCardForBenefit(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD USAGE */}
      {activeCardForUsage && (
        <div className="notion-modal-backdrop">
          <div className="notion-modal-box">
            <div className="notion-modal-header">
              <h3>Record Usage for {activeCardForUsage.card_name}</h3>
              <button className="notion-modal-close" onClick={() => setActiveCardForUsage(null)}>✕</button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "15px" }}>
              Link this card payment to one of your recorded expenses and track benefits earned.
            </p>
            <form onSubmit={handleRecordUsage}>
              <div>
                <label>Select Expense Transaction</label>
                <select
                  value={usageForm.expense_id}
                  onChange={e => setUsageForm({ ...usageForm, expense_id: e.target.value })}
                  required
                >
                  <option value="">-- Choose an expense --</option>
                  {expenses.map(exp => (
                    <option key={exp.expense_id} value={exp.expense_id}>
                      {exp.expense_date} - {exp.category} (₹{exp.amount}) {exp.merchant ? `at ${exp.merchant}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Benefit Received (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50.00 (cashback earned)"
                  value={usageForm.benefit_received}
                  onChange={e => setUsageForm({ ...usageForm, benefit_received: e.target.value })}
                />
              </div>
              <div className="notion-modal-actions">
                <button type="submit" className="notion-btn-primary" style={{ flex: 1 }}>
                  Save Usage
                </button>
                <button type="button" className="notion-btn-secondary" style={{ flex: 1 }} onClick={() => setActiveCardForUsage(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 3: CARD RECOMMENDATIONS & OPTIMIZER */}
      <div style={{ marginTop: "40px", borderTop: "1px solid var(--border-default)", paddingTop: "25px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3>Card Recommendation & Reward Optimizer</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              Transparent recommendations based solely on your registered card benefit rules and historical spending patterns.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Filter by category (e.g. Dining)"
              value={recCategory}
              onChange={e => {
                setRecCategory(e.target.value);
                fetchRecommendations(e.target.value);
              }}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-default)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "13px" }}
            />
          </div>
        </div>

        {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "15px" }}>
            {recommendations.recommendations.map((rec, idx) => (
              <div key={idx} className="rec-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ color: "var(--primary-text)", margin: 0, fontWeight: 700 }}>{rec.category}</h4>
                  <span className="rec-badge">Best Match</span>
                </div>
                {rec.best_card ? (
                  <>
                    <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                      💳 {rec.best_card.card_name} ({rec.best_card.issuer})
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--success-text)", fontWeight: 600, marginBottom: "8px" }}>
                      ⭐ {rec.best_card.benefit_value}% {rec.best_card.benefit_type}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                      {rec.explanation}
                    </p>
                    {rec.historical_spending > 0 && (
                      <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-muted)", borderTop: "1px dashed var(--border-subtle)", paddingTop: "6px" }}>
                        Recorded spending in this category: ₹{rec.historical_spending.toFixed(2)}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{rec.explanation}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {recommendations ? recommendations.message : "Add payment cards and configured benefits to unlock smart card recommendations."}
          </p>
        )}
      </div>

      {/* CARD USAGE HISTORY */}
      <div style={{ marginTop: "40px", borderTop: "1px solid var(--border-default)", paddingTop: "25px" }}>
        <h3>Recorded Card Usage History</h3>
        {usages.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "10px" }}>No card usage entries recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "15px" }}>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Card Used</th>
                  <th>Linked Expense</th>
                  <th>Category</th>
                  <th>Expense Amount</th>
                  <th>Benefit Received</th>
                </tr>
              </thead>
              <tbody>
                {usages.map(u => (
                  <tr key={u.usage_id}>
                    <td>{new Date(u.used_at).toLocaleDateString()}</td>
                    <td><strong>{u.card_name}</strong> (•••• {u.last_four_digits || "XXXX"})</td>
                    <td>{u.expense ? (u.expense.merchant || "Direct Expense") : "None"}</td>
                    <td>{u.expense ? u.expense.category : "-"}</td>
                    <td>{u.expense ? `₹${u.expense.amount.toFixed(2)}` : "-"}</td>
                    <td style={{ color: "var(--success-text)", fontWeight: "700" }}>
                      {u.benefit_received ? `+₹${u.benefit_received.toFixed(2)}` : "₹0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
