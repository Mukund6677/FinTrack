import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
  const [monthlyComparison, setMonthlyComparison] = useState(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState(null);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [budgets, setBudgets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  
  const [splitBills, setSplitBills] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [showSplitBillForm, setShowSplitBillForm] = useState(false);
  const [splitBillForm, setSplitBillForm] = useState({
    title: "",
    total_amount: "",
    bill_date: "",
    description: "",
    participants: [
      { name: "", share_amount: "" },
      { name: "", share_amount: "" }
    ]
  });

  const [showAllocationForm, setShowAllocationForm] = useState(false);

  const [allocationForm, setAllocationForm] = useState({
    title: "",
    category: "",
    planned_amount: "",
    due_date: "",
    description: "",
  });
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const [budgetSummary, setBudgetSummary] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState([]);
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async (token) => {
    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load dashboard");
      }

      setDashboard(data);
    } catch (error) {
      setMessage(error.message);
      localStorage.removeItem("access_token");
      setDashboard(null);
    }
  };

  const fetchMonthlyAnalytics = async (token, year, month) => {
    try {
      const [
        analyticsResponse,
        comparisonResponse,
        categoryResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/monthly-analytics?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(
          `${API_URL}/monthly-comparison?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(
          `${API_URL}/monthly-category-analysis?year=${year}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      if (
        !analyticsResponse.ok ||
        !comparisonResponse.ok ||
        !categoryResponse.ok
      ) {
        throw new Error("Failed to load monthly analytics");
      }

      const analyticsData = await analyticsResponse.json();
      const comparisonData = await comparisonResponse.json();
      const categoryData = await categoryResponse.json();

      setMonthlyAnalytics(analyticsData);
      setMonthlyComparison(comparisonData);
      setCategoryAnalysis(categoryData);
    } catch (error) {
      console.error("Monthly analytics error:", error);
    }
  };

  const fetchBudgetAlerts = async (token) => {
    try {
      const response = await fetch(`${API_URL}/budget-alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load budget alerts");
      }

      const data = await response.json();
      console.log("Budget alerts data:", data);
      setBudgetAlerts(data);
    } catch (error) {
      console.error("Budget alerts error:", error);
    }
  };

  const fetchTransactions = async (token) => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load transactions");
      }

      setTransactions(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchBudgets = async (token) => {
    try {
      const response = await fetch(`${API_URL}/budgets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load budgets");
      }

      setBudgets(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchAllocations = async (token) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/allocations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch allocations");
      }

      const data = await response.json();
      setAllocations(data);
    } catch (error) {
      console.error("Fetch allocations error:", error);
    }
  };

  
  const fetchRegisteredUsers = async (token) => {
    try {
      const response = await fetch(`${API_URL}/users/lookup`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load registered users");
      }

      setRegisteredUsers(data);
    } catch (error) {
      setMessage(error.message);
    }
  };
  
  const fetchSplitBills = async (token) => {
    try {
      const response = await fetch(`${API_URL}/split-bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load split bills");
      }

      setSplitBills(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAddSplitBill = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    const payload = {
      ...splitBillForm,
      total_amount: Number(splitBillForm.total_amount),
      participants: splitBillForm.participants.map((person) => ({
        name: person.name.trim(),
        user_id: person.user_id ?? null,
        share_amount: Number(person.share_amount),
      })),
    };

    try {
      const response = await fetch(`${API_URL}/split-bills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create split bill");
      }

      setSplitBillForm({
        title: "",
        total_amount: "",
        bill_date: "",
        description: "",
        participants: [
          { name: "", share_amount: "" },
          { name: "", share_amount: "" },
        ],
      });

      setShowSplitBillForm(false);
      await fetchSplitBills(token);
      setMessage("Split bill created successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleRecordSettlement = async (splitBillId, participantId) => {
    const amount = window.prompt("Enter payment amount (₹):");

    if (amount === null || amount.trim() === "") {
      return;
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setMessage("Enter a valid payment amount greater than zero.");
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch(
        `${API_URL}/split-bills/${splitBillId}/settlements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participant_id: participantId,
            amount: paymentAmount,
            settlement_date: new Date().toISOString().slice(0, 10),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to record settlement");
      }

      await fetchSplitBills(token);
      setMessage(
        `Payment recorded. Outstanding: ₹${data.outstanding_amount}`
      );
    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchBudgetSummary = async (token) => {
    try {
      const response = await fetch(`${API_URL}/budget-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load budget summary"
        );
      }

      setBudgetSummary(data);

    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchExpenseSummary = async (token) => {
    try {
      const response = await fetch(`${API_URL}/expense-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load expense summary"
        );
      }

      setExpenseSummary(data);

    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchFilteredDashboard = async (token, start, end) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/dashboard-filtered?start_date=${start}&end_date=${end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch filtered dashboard");
      }

      const data = await response.json();
      setDashboard(data);
      setIsFiltered(true);
    } catch (error) {
      console.error("Filtered dashboard error:", error);
    }
  };

  const handleApplyFilter = () => {
    const token = localStorage.getItem("access_token");

    if (!startDate || !endDate) {
      setMessage("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setMessage("Start date cannot be after end date.");
      return;
    }

    fetchFilteredDashboard(token, startDate, endDate);
    setMessage("");
  };

  const handleClearFilter = () => {
    const token = localStorage.getItem("access_token");

    setStartDate("");
    setEndDate("");
    setIsFiltered(false);

    fetchDashboard(token);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      fetchDashboard(token);
      fetchTransactions(token);
      fetchBudgets(token);
      fetchBudgetSummary(token);
      fetchExpenseSummary(token);
      fetchAllocations(token);
      fetchSplitBills(token);
      fetchRegisteredUsers(token);
      fetchBudgetAlerts(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);

      await fetchDashboard(data.access_token);
      await fetchTransactions(data.access_token);
      await fetchBudgets(data.access_token);
      await fetchAllocations(data.access_token);
      await fetchSplitBills(data.access_token);
      await fetchRegisteredUsers(data.access_token);
      await fetchBudgetSummary(data.access_token);
      await fetchExpenseSummary(data.access_token);
      await fetchExpenseSummary(data.access_token);
      const now = new Date();

      await fetchMonthlyAnalytics(
        data.access_token,
        now.getFullYear(),
        now.getMonth() + 1
      );
      await fetchBudgetAlerts(data.access_token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e, type) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");
    const formData = new FormData(e.target);

    let payload;

    if (type === "income") {
      payload = {
        amount: Number(formData.get("amount")),
        source: formData.get("source"),
        income_date: formData.get("date"),
        description: formData.get("description") || null,
        source_type: "MANUAL",
      };
    } else {
      payload = {
        amount: Number(formData.get("amount")),
        category: formData.get("category"),
        merchant: formData.get("merchant") || null,
        expense_date: formData.get("date"),
        description: formData.get("description") || null,
        payment_method: formData.get("payment_method") || null,
        source: "MANUAL",
      };
    }

    try {
      const endpoint =
        type === "income"
          ? `${API_URL}/income`
          : `${API_URL}/expense`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add transaction");
      }

      await fetchDashboard(token);
      await fetchTransactions(token);

      setShowIncomeForm(false);
      setShowExpenseForm(false);

      setMessage(
        type === "income"
          ? "Income added successfully!"
          : "Expense added successfully!"
      );

    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAddAllocation = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    try {
      const response = await fetch("http://127.0.0.1:8000/allocation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...allocationForm,
          planned_amount: Number(allocationForm.planned_amount),
          category: allocationForm.category || null,
          due_date: allocationForm.due_date || null,
          description: allocationForm.description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to add allocation"
        );
      }

      setMessage("Income allocation added successfully!");

      setAllocationForm({
        title: "",
        category: "",
        planned_amount: "",
        due_date: "",
        description: "",
      });

      setShowAllocationForm(false);
      await fetchAllocations(token);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleUpdateAllocation = async (
    allocationId,
    currentActualAmount,
    currentStatus
  ) => {
    const actualInput = window.prompt(
      "Enter the actual amount spent:",
      String(currentActualAmount ?? 0)
    );

    if (actualInput === null) return;

    const actualAmount = Number(actualInput);

    if (!Number.isFinite(actualAmount) || actualAmount < 0) {
      setMessage("Enter a valid, non-negative actual amount.");
      return;
    }

    const statusInput = window.prompt(
      "Enter status: PENDING, COMPLETED, or CANCELLED",
      currentStatus
    );

    if (statusInput === null) return;

    const status = statusInput.trim().toUpperCase();

    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      setMessage("Invalid allocation status.");
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      const params = new URLSearchParams({
        actual_amount: String(actualAmount),
        status,
      });

      const response = await fetch(
        `http://127.0.0.1:8000/allocations/${allocationId}?${params}`,
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

      setMessage("Allocation updated successfully.");
      await fetchAllocations(token);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setDashboard(null);
    setTransactions([]);

    setEmail("");
    setPassword("");
    setMessage("");
  };

  if (dashboard) {
    return (
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <h1>FinTrack</h1>
            <p>Personal Finance Dashboard</p>
          </div>

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="date-filter">
          <h3>Filter Dashboard</h3>

          <div className="date-filter-controls">
            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button onClick={handleApplyFilter}>
              Apply Filter
            </button>

            {isFiltered && (
              <button onClick={handleClearFilter}>
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="dashboard-grid">

          <div className="dashboard-card">
            <h3>Total Income</h3>
            <p>₹{dashboard.total_income}</p>
          </div>

          <div className="dashboard-card">
            <h3>Total Expenses</h3>
            <p>₹{dashboard.total_expenses}</p>
          </div>

          <div className="dashboard-card">
            <h3>Balance</h3>
            <p>₹{dashboard.balance}</p>
          </div>

          <div className="dashboard-card">
            <h3>Transactions</h3>
            <p>{dashboard.transaction_count}</p>
          </div>

        </div>

        {/* MONTHLY ANALYTICS */}
        {monthlyAnalytics && (
          <div className="dashboard-grid monthly-analytics">
            <div className="dashboard-card">
              <h3>Monthly Income</h3>
              <p>₹{Number(monthlyAnalytics.total_income).toLocaleString("en-IN")}</p>
            </div>

            <div className="dashboard-card">
              <h3>Monthly Expenses</h3>
              <p>₹{Number(monthlyAnalytics.total_expenses).toLocaleString("en-IN")}</p>
            </div>

            <div className="dashboard-card">
              <h3>Monthly Balance</h3>
              <p>₹{Number(monthlyAnalytics.balance).toLocaleString("en-IN")}</p>
            </div>

            <div className="dashboard-card">
              <h3>Savings Rate</h3>
              <p>
                {monthlyAnalytics.savings_rate_percent == null
                  ? "N/A"
                  : `${monthlyAnalytics.savings_rate_percent}%`}
              </p>
            </div>
          </div>
        )}

        {/* MONTH-ON-MONTH COMPARISON */}
        {monthlyComparison && (
          <div className="dashboard-grid monthly-analytics">
            <div className="dashboard-card">
              <h3>Income Change</h3>
              <p>
                ₹{Number(
                  monthlyComparison.comparison.income.difference
                ).toLocaleString("en-IN")}
              </p>
              <small>
                {monthlyComparison.comparison.income.percentage_change == null
                  ? "No previous-month baseline"
                  : `${monthlyComparison.comparison.income.percentage_change}% vs previous month`}
              </small>
            </div>

            <div className="dashboard-card">
              <h3>Expense Change</h3>
              <p>
                ₹{Number(
                  monthlyComparison.comparison.expenses.difference
                ).toLocaleString("en-IN")}
              </p>
              <small>
                {monthlyComparison.comparison.expenses.percentage_change == null
                  ? "No previous-month baseline"
                  : `${monthlyComparison.comparison.expenses.percentage_change}% vs previous month`}
              </small>
            </div>
          </div>
        )}

        {/* CATEGORY-WISE SPENDING */}
        {categoryAnalysis && (
          <div className="dashboard-section">
            <h2>Monthly Spending by Category</h2>

            <div className="category-analysis-list">
              {categoryAnalysis.categories.map((item) => (
                <div className="category-analysis-item" key={item.category}>
                  <div className="category-analysis-header">
                    <strong>{item.category}</strong>
                    <span>
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                      {" "}({item.percentage}%)
                    </span>
                  </div>

                  <div className="category-progress-track">
                    <div
                      className="category-progress-fill"
                      style={{
                        width: `${Math.min(Number(item.percentage) || 0, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p>
              Total monthly spending: ₹
              {Number(categoryAnalysis.total_expenses).toLocaleString("en-IN")}
            </p>
          </div>
        )}

        {/* BUDGET ALERTS */}
        <div className="dashboard-section">
          <h2>Budget Alerts</h2>

          {budgetAlerts.length === 0 ? (
            <p>No budget alerts available.</p>
          ) : (
            <div className="budget-alert-list">
              {budgetAlerts.map((alert) => (
                <div
                  className="budget-alert-item"
                  key={alert.budget_id}
                >
                  <div className="category-analysis-header">
                    <strong>{alert.category}</strong>
                    <span>{alert.status.replaceAll("_", " ")}</span>
                  </div>

                  <p>
                    Spent: ₹{Number(alert.spent).toLocaleString("en-IN")}
                    {" / "}
                    ₹{Number(alert.budget_limit).toLocaleString("en-IN")}
                  </p>

                  <div className="category-progress-track">
                    <div
                      className="category-progress-fill"
                      style={{
                        width: `${Math.min(
                          Number(alert.utilization_percentage) || 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p>{alert.message}</p>

                  <small>
                    {alert.utilization_percentage}% used
                    {" · "}
                    {Number(alert.remaining) < 0
                      ? `₹${Math.abs(Number(alert.remaining)).toLocaleString("en-IN")} over budget`
                      : `₹${Number(alert.remaining).toLocaleString("en-IN")} remaining`}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>



        <div className="action-buttons">

          <button
            className="income-button"
            onClick={() => setShowIncomeForm(true)}
          >
            + Add Income
          </button>

          <button
            className="expense-button"
            onClick={() => setShowExpenseForm(true)}
          >
            + Add Expense
          </button>

        </div>

        {showIncomeForm && (
          <div className="transaction-form">

            <h2>Add Income</h2>

            <form onSubmit={(e) => handleAddTransaction(e, "income")}>

              <label>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
              />

              <label>Source</label>
              <input
                type="text"
                name="source"
                placeholder="Salary, Freelance, etc."
                required
              />

              <label>Date</label>
              <input
                type="date"
                name="date"
                required
              />

              <label>Description</label>
              <input
                type="text"
                name="description"
                placeholder="Optional"
              />

              <div className="form-buttons">

                <button type="submit">
                  Add Income
                </button>

                <button
                  type="button"
                  onClick={() => setShowIncomeForm(false)}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        )}

        {showExpenseForm && (
          <div className="transaction-form">

            <h2>Add Expense</h2>

            <form onSubmit={(e) => handleAddTransaction(e, "expense")}>

              <label>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                min="0"
                step="0.01"
                required
              />

              <label>Category</label>
              <input
                type="text"
                name="category"
                placeholder="Food, Travel, Shopping, etc."
                required
              />

              <label>Merchant</label>
              <input
                type="text"
                name="merchant"
                placeholder="Optional"
              />

              <label>Date</label>
              <input
                type="date"
                name="date"
                required
              />

              <label>Description</label>
              <input
                type="text"
                name="description"
                placeholder="Optional"
              />

              <label>Payment Method</label>
              <select name="payment_method">
                <option value="">Select payment method</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>

              <div className="form-buttons">

                <button type="submit">
                  Add Expense
                </button>

                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        )}

        {/* INCOME ALLOCATION SECTION */}
        <div className="budgets-section">
          <div className="section-header">
            <h2>Transaction</h2>

            <button
              className="budget-button"
              onClick={() => setShowAllocationForm(!showAllocationForm)}
            >
              {showAllocationForm ? "Cancel" : "+ Add Allocation"}
            </button>
          </div>

          {showAllocationForm && (
            <div className="transaction-form">
              <form onSubmit={handleAddAllocation}>
                <input
                  type="text"
                  placeholder="Title (e.g. Monthly Rent)"
                  value={allocationForm.title}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, title: e.target.value })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Category (e.g. Housing)"
                  value={allocationForm.category}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, category: e.target.value })
                  }
                />

                <input
                  type="number"
                  placeholder="Planned Amount (₹)"
                  min="0.01"
                  step="0.01"
                  value={allocationForm.planned_amount}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      planned_amount: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="date"
                  value={allocationForm.due_date}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, due_date: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={allocationForm.description}
                  onChange={(e) =>
                    setAllocationForm({
                      ...allocationForm,
                      description: e.target.value,
                    })
                  }
                />

                <button type="submit">Save Allocation</button>
              </form>
            </div>
          )}

          <div className="budgets-grid">
            {allocations.length === 0 ? (
              <p>No allocations found. Add your first allocation.</p>
            ) : (
              allocations.map((allocation) => (
                <div className="budget-card" key={allocation.allocation_id}>
                  <h3>{allocation.title}</h3>
                  <p><strong>Category:</strong> {allocation.category || "Uncategorized"}</p>
                  <p><strong>Planned:</strong> ₹{allocation.planned_amount}</p>
                  <p><strong>Actual:</strong> ₹{allocation.actual_amount}</p>
                  <p><strong>Remaining:</strong> ₹
                    {(Number(allocation.planned_amount) -
                      Number(allocation.actual_amount)).toFixed(2)}
                  </p>
                  <p><strong>Due Date:</strong> {allocation.due_date || "Not set"}</p>
                  <p><strong>Status:</strong> {allocation.status}</p>
                  {allocation.description && <p>{allocation.description}</p>}
                  <button
                  className="budget-button"
                  onClick={() =>
                    handleUpdateAllocation(
                      allocation.allocation_id,
                      allocation.actual_amount,
                      allocation.status
                    )
                  }
                >
                  Update Allocation
                </button>
                </div>
              ))
            )}
          </div>
        </div>

        
        
        {/* SPLIT BILLS SECTION */}
        <div className="budgets-section">
          <div className="section-header">
            <h2>Split Bills</h2>
            <button
              className="budget-button"
              onClick={() => setShowSplitBillForm(!showSplitBillForm)}
            >
              {showSplitBillForm ? "Cancel" : "+ Add Split Bill"}
            </button>
          </div>

          {showSplitBillForm && (
            <form className="transaction-form" onSubmit={handleAddSplitBill}>
              <input
                type="text"
                placeholder="Bill title (e.g. Team Lunch)"
                value={splitBillForm.title}
                onChange={(e) =>
                  setSplitBillForm({ ...splitBillForm, title: e.target.value })
                }
                required
              />

              <input
                type="number"
                placeholder="Total amount (₹)"
                min="0.01"
                step="0.01"
                value={splitBillForm.total_amount}
                onChange={(e) =>
                  setSplitBillForm({
                    ...splitBillForm,
                    total_amount: e.target.value,
                  })
                }
                required
              />

              <input
                type="date"
                value={splitBillForm.bill_date}
                onChange={(e) =>
                  setSplitBillForm({ ...splitBillForm, bill_date: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="Description (optional)"
                value={splitBillForm.description}
                onChange={(e) =>
                  setSplitBillForm({
                    ...splitBillForm,
                    description: e.target.value,
                  })
                }
              />

              <h3>Participants</h3>

              {splitBillForm.participants.map((person, index) => (
                <div key={index} className="form-row">
                  <input
                    type="text"
                    placeholder={`Person ${index + 1} name`}
                    value={person.name}
                    onChange={(e) => {
                      const participants = [...splitBillForm.participants];
                      participants[index] = {
                        ...participants[index],
                        name: e.target.value,
                      };
                      setSplitBillForm({ ...splitBillForm, participants });
                    }}
                    required
                  />
      
                  <select
                    value={person.user_id ?? ""}
                    onChange={(e) => {
                      const participants = [...splitBillForm.participants];
                      const selectedUser = registeredUsers.find(
                        (user) => String(user.user_id) === e.target.value
                      );

                      participants[index] = {
                        ...participants[index],
                        user_id: e.target.value ? Number(e.target.value) : null,
                        name: selectedUser
                          ? selectedUser.name
                          : participants[index].name,
                      };

                      setSplitBillForm({ ...splitBillForm, participants });
                    }}
                  >
                    <option value="">External participant (no account)</option>
                    {registeredUsers.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} (ID: {user.user_id})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Share amount (₹)"
                    min="0.01"
                    step="0.01"
                    value={person.share_amount}
                    onChange={(e) => {
                      const participants = [...splitBillForm.participants];
                      participants[index] = {
                        ...participants[index],
                        share_amount: e.target.value,
                      };
                      setSplitBillForm({ ...splitBillForm, participants });
                    }}
                    required
                  />

                  <button
                    type="button"
                    className="budget-button"
                    onClick={() => {
                      const participants = splitBillForm.participants.filter(
                        (_, i) => i !== index
                      );
                      setSplitBillForm({ ...splitBillForm, participants });
                    }}
                    disabled={splitBillForm.participants.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="budget-button"
                onClick={() =>
                  setSplitBillForm({
                    ...splitBillForm,
                    participants: [
                      ...splitBillForm.participants,
                      { name: "", share_amount: "" },
                    ],
                  })
                }
              >
                + Add Participant
              </button>

              <div className="form-buttons">
                <button type="submit">Save Split Bill</button>
                <button
                  type="button"
                  onClick={() => setShowSplitBillForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="budgets-grid">
            {splitBills.length === 0 ? (
              <p>No split bills found. Add your first split bill.</p>
            ) : (
              splitBills.map((bill) => (
                <div className="budget-card" key={bill.split_bill_id}>
                  <h3>{bill.title}</h3>
                  <p><strong>Total:</strong> ₹{bill.total_amount}</p>
                  <p><strong>Date:</strong> {bill.bill_date}</p>
                  {bill.description && <p>{bill.description}</p>}

                  <h4>Participants</h4>

                  {bill.participants.map((person) => {
                    const outstanding = Math.max(
                      0,
                      Number(person.share_amount) - Number(person.amount_paid || 0)
                    );

                    return (
                      <div key={person.participant_id}>
                        <p><strong>{person.name}</strong></p>
                        <p>Share: ₹{person.share_amount}</p>
                        <p>Paid: ₹{person.amount_paid || "0.00"}</p>
                        <p>Outstanding: ₹{outstanding.toFixed(2)}</p>
                        <p>Status: {person.status}</p>

                        {outstanding > 0 && (
                          <button
                            className="budget-button"
                            onClick={() =>
                              handleRecordSettlement(
                                bill.split_bill_id,
                                person.participant_id
                              )
                            }
                          >
                            Record Payment
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>




        {/* BUDGETS */}

        <div className="budgets-section">

          <div className="section-header">
            <h2>My Budgets</h2>

            <button
              className="budget-button"
              onClick={() => setShowBudgetForm(true)}
            >
              + Add Budget
            </button>
          </div>

          {budgetSummary.length === 0 ? (
            <p>No budgets found.</p>
          ) : (
            <div className="budgets-grid">

              {budgetSummary.map((budget) => (
                <div className="budget-card" key={budget.budget_id}>

                  <h3>{budget.category}</h3>

                  <p className="budget-amount">
                    ₹{budget.budget_limit}
                  </p>

                  <p>
                    <strong>Spent:</strong> ₹{budget.spent}
                  </p>

                  <p>
                    <strong>Remaining:</strong> ₹{budget.remaining}
                  </p>

                  <p>
                    <strong>Used:</strong> {budget.utilization_percentage}%
                  </p>

                  <p>
                    Period: {budget.period}
                  </p>

                  <p>
                    {budget.start_date} → {budget.end_date}
                  </p>

                  <div className="budget-progress">

                    <div
                      className="budget-progress-bar"
                      style={{
                        width: `${Math.min(
                          budget.utilization_percentage,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {showBudgetForm && (
          <div className="transaction-form">

            <h2>Add Budget</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const token = localStorage.getItem("access_token");
                const formData = new FormData(e.target);

                const payload = {
                  category: formData.get("category"),
                  limit_amount: Number(formData.get("limit_amount")),
                  period: formData.get("period"),
                  start_date: formData.get("start_date"),
                  end_date: formData.get("end_date"),
                };

                try {
                  const response = await fetch(`${API_URL}/budget`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      data.detail || "Failed to add budget"
                    );
                  }

                  await fetchBudgets(token);

                  setShowBudgetForm(false);

                  setMessage("Budget added successfully!");

                } catch (error) {
                  setMessage(error.message);
                }
              }}
            >

              <label>Category</label>

              <input
                type="text"
                name="category"
                placeholder="Food, Travel, Shopping..."
                required
              />

              <label>Budget Limit</label>

              <input
                type="number"
                name="limit_amount"
                placeholder="Enter budget limit"
                min="0"
                step="0.01"
                required
              />

              <label>Period</label>

              <select name="period" required>
                <option value="">Select period</option>
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="YEARLY">Yearly</option>
              </select>

              <label>Start Date</label>

              <input
                type="date"
                name="start_date"
                required
              />

              <label>End Date</label>

              <input
                type="date"
                name="end_date"
                required
              />

              <div className="form-buttons">

                <button type="submit">
                  Add Budget
                </button>

                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        )}

        {/* SPENDING ANALYTICS */}

        <div className="analytics-section">

          <h2>Spending by Category</h2>

          {expenseSummary.length === 0 ? (
            <p>No expense data available.</p>
          ) : (
            <div className="analytics-list">

              {expenseSummary.map((item) => (
                <div
                  className="analytics-row"
                  key={item.category}
                >

                  <div className="analytics-info">

                    <span className="analytics-category">
                      {item.category}
                    </span>

                    <span className="analytics-amount">
                      ₹{item.total_amount}
                    </span>

                  </div>

                  <div className="analytics-bar">

                    <div
                      className="analytics-bar-fill"
                      style={{
                        width: `${
                          Math.min(
                            (Number(item.total_amount) /
                              Number(dashboard.total_expenses)) *
                              100,
                            100
                          )
                        }%`,
                      }}
                    />

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>


        {/* TRANSACTIONS */}

        <div className="transactions-section">

          <h2>Recent Transactions</h2>

          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
            <div className="transactions-table-container">

              <table className="transactions-table">

                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Source</th>
                  </tr>
                </thead>

                <tbody>

                  {transactions.map((transaction, index) => (
                    <tr key={`${transaction.type}-${transaction.id}-${index}`}>

                      <td>
                        <span
                          className={
                            transaction.type === "INCOME"
                              ? "income-badge"
                              : "expense-badge"
                          }
                        >
                          {transaction.type}
                        </span>
                      </td>

                      <td>{transaction.category}</td>

                      <td>
                        ₹{transaction.amount}
                      </td>

                      <td>
                        {transaction.date}
                      </td>

                      <td>
                        {transaction.description || "-"}
                      </td>

                      <td>
                        {transaction.source || "-"}
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

  return (
    <div className="login-container">

      <div className="login-card">

        <h1>FinTrack</h1>

        <p className="subtitle">
          Personal Finance Management System
        </p>

        <form onSubmit={handleLogin}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {message && (
          <p className="message">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default App;