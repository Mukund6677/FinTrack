import { useEffect, useState } from "react";
import CardsManager from "./components/CardsManager";
import FinancialReports from "./components/FinancialReports";
import AIAssistant from "./components/AIAssistant";
import SMSImporter from "./components/SMSImporter";
import { API_URL } from "./config/api";
import Modal from "./components/common/Modal";
import ConfirmDialog from "./components/common/ConfirmDialog";
import ToastContainer from "./components/common/Toast";
import UpdateAllocationModal from "./components/allocations/UpdateAllocationModal";
import RecordSettlementModal from "./components/splits/RecordSettlementModal";

const getCategoryIcon = (category) => {
  if (!category) return "💳";
  const cat = String(category).toLowerCase();
  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("cafe")) return "🍔";
  if (cat.includes("grocer") || cat.includes("supermarket") || cat.includes("market")) return "🛒";
  if (cat.includes("transport") || cat.includes("fuel") || cat.includes("petrol") || cat.includes("travel") || cat.includes("commute") || cat.includes("uber") || cat.includes("cab")) return "🚗";
  if (cat.includes("shop") || cat.includes("cloth") || cat.includes("apparel") || cat.includes("retail")) return "🛍️";
  if (cat.includes("entertain") || cat.includes("movie") || cat.includes("netflix") || cat.includes("game")) return "🎬";
  if (cat.includes("utilit") || cat.includes("bill") || cat.includes("electric") || cat.includes("water") || cat.includes("wifi")) return "💡";
  if (cat.includes("hous") || cat.includes("rent") || cat.includes("home")) return "🏠";
  if (cat.includes("health") || cat.includes("medic") || cat.includes("doctor") || cat.includes("pharmacy")) return "🏥";
  if (cat.includes("educat") || cat.includes("book") || cat.includes("course") || cat.includes("tutor")) return "📚";
  if (cat.includes("split") || cat.includes("friend") || cat.includes("shared")) return "👥";
  if (cat.includes("saving") || cat.includes("invest") || cat.includes("deposit")) return "💰";
  if (cat.includes("salary") || cat.includes("income") || cat.includes("pay")) return "💵";
  return "💳";
};

const getBudgetStatusInfo = (alert) => {
  const status = alert.status;
  const util = Number(alert.utilization_percentage) || 0;
  if (status === "OVER_BUDGET" || util > 100) {
    return {
      label: "OVER BUDGET",
      badgeClass: "budget-badge-danger",
      barClass: "progress-danger",
      textClass: "text-danger"
    };
  }
  if (status === "NEAR_LIMIT" || util >= 80) {
    return {
      label: "NEAR LIMIT",
      badgeClass: "budget-badge-warning",
      barClass: "progress-warning",
      textClass: "text-warning"
    };
  }
  return {
    label: "WITHIN BUDGET",
    badgeClass: "budget-badge-success",
    barClass: "progress-success",
    textClass: "text-success"
  };
};

const formatCurrency = (val) => {
  if (val == null || isNaN(Number(val))) return "₹0.00";
  return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateClean = (d) => {
  if (!d) return "-";
  try {
    const parts = String(d).split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime()) ? d : dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return d;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewSubView, setOverviewSubView] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("ALL");
  const [timeRangeFilter, setTimeRangeFilter] = useState("ALL");
  const [userCards, setUserCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

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
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [developerStats, setDeveloperStats] = useState(null);
  const [developerAuditLogs, setDeveloperAuditLogs] = useState([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Modern In-App Toast Notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type) => {
    if (!msg) return;
    const str = String(msg);
    let resolvedType = type;
    if (!resolvedType) {
      const lower = str.toLowerCase();
      if (
        str.startsWith("❌") ||
        lower.includes("failed") ||
        lower.includes("error") ||
        lower.includes("invalid") ||
        lower.includes("unable")
      ) {
        resolvedType = "error";
      } else if (
        lower.includes("success") ||
        lower.includes("registered") ||
        lower.includes("created") ||
        lower.includes("deleted") ||
        lower.includes("recorded") ||
        lower.includes("added")
      ) {
        resolvedType = "success";
      } else {
        resolvedType = "info";
      }
    }
    const cleanMsg = str.replace(/^[❌✅ℹ️⚠️]\s*/, "");
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message: cleanMsg, type: resolvedType }]);
    setMessage(str);
  };
  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State for in-app confirmation modal when deleting transactions
  const [deleteTransactionTarget, setDeleteTransactionTarget] = useState(null);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);

  // State for in-app split bills payment recording modal
  const [settlementTarget, setSettlementTarget] = useState(null);

  // State for in-app income allocation update modal
  const [editingAllocation, setEditingAllocation] = useState(null);

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
      const response = await fetch(`${API_URL}/allocations`, {
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

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    }
  };

  const fetchNotifications = async (token) => {
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        setNotifications(listData);
      }
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unread_count || 0);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/${notifId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchNotifications(token);
      }
    } catch (error) {
      console.error("Mark read error:", error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchNotifications(token);
      }
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  };

  const fetchDeveloperData = async (token) => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/developer/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/developer/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        setDeveloperStats(await statsRes.json());
      }
      if (logsRes.ok) {
        setDeveloperAuditLogs(await logsRes.json());
      }
    } catch (error) {
      console.error("Developer fetch error:", error);
    }
  };

  const handleDeleteTransaction = (transaction) => {
    setDeleteTransactionTarget(transaction);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!deleteTransactionTarget) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsDeletingTransaction(true);
    try {
      const endpoint =
        deleteTransactionTarget.type === "INCOME"
          ? `${API_URL}/income/${deleteTransactionTarget.id}`
          : `${API_URL}/expenses/${deleteTransactionTarget.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to delete record");

      addToast(
        `${deleteTransactionTarget.type === "INCOME" ? "Income" : "Expense"} record deleted successfully.`,
        "success"
      );
      setDeleteTransactionTarget(null);
      await fetchDashboard(token);
      await fetchTransactions(token);
      await fetchExpenseSummary(token);
      await fetchBudgetSummary(token);
      await fetchNotifications(token);
    } catch (error) {
      addToast(`❌ ${error.message}`, "error");
    } finally {
      setIsDeletingTransaction(false);
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

  const handleRecordSettlement = (splitBillId, participantId) => {
    const bill = splitBills.find((b) => b.split_bill_id === splitBillId);
    const participant = bill?.participants?.find(
      (p) => p.participant_id === participantId
    );
    if (bill && participant) {
      setSettlementTarget({ bill, participant });
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
        `${API_URL}/dashboard-filtered?start_date=${start}&end_date=${end}`,
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

  const fetchUserCards = async (token) => {
    try {
      const response = await fetch(`${API_URL}/cards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserCards(data);
      }
    } catch (error) {
      console.error("fetchUserCards error:", error);
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

  const loadUserData = async (token) => {
    await fetchUserProfile(token);
    await fetchDashboard(token);
    await fetchTransactions(token);
    await fetchBudgets(token);
    await fetchAllocations(token);
    await fetchSplitBills(token);
    await fetchRegisteredUsers(token);
    await fetchBudgetSummary(token);
    await fetchExpenseSummary(token);
    await fetchNotifications(token);
    await fetchUserCards(token);
    const now = new Date();
    await fetchMonthlyAnalytics(token, now.getFullYear(), now.getMonth() + 1);
    await fetchBudgetAlerts(token);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      loadUserData(token);
    }
    // Background polling for notifications (every 30 seconds)
    const interval = setInterval(() => {
      const activeToken = localStorage.getItem("access_token");
      if (activeToken) {
        fetchNotifications(activeToken);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const cleanName = registerName ? registerName.trim() : "";

    if (!normalizedEmail) {
      setMessage("❌ Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: normalizedEmail,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("This email is already registered. Please sign in instead.");
        }
        throw new Error(data.detail || "Registration failed");
      }

      setMessage("Account created successfully! Logging you in...");

      const formData = new URLSearchParams();
      formData.append("username", normalizedEmail);
      formData.append("password", password);

      const loginRes = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.access_token) {
        localStorage.setItem("access_token", loginData.access_token);
        await loadUserData(loginData.access_token);
      } else {
        setIsRegistering(false);
        setMessage("Account registered! Please sign in with your credentials.");
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    try {
      const formData = new URLSearchParams();

      formData.append("username", normalizedEmail);
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
      await loadUserData(data.access_token);
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
      await fetchNotifications(token);

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
      const response = await fetch(`${API_URL}/allocation`, {
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
            : "Failed to create allocation."
        );
      }

      setMessage("Income allocation created successfully.");

      setShowAllocationForm(false);
      setAllocationForm({
        title: "",
        category: "",
        planned_amount: "",
        due_date: "",
        description: "",
      });

      await fetchAllocations(token);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleUpdateAllocation = (
    allocationId,
    currentActualAmount,
    currentStatus
  ) => {
    const allocation = allocations.find(
      (a) => a.allocation_id === allocationId
    ) || {
      allocation_id: allocationId,
      actual_amount: currentActualAmount,
      status: currentStatus,
      title: "Allocation",
      planned_amount: 0,
    };
    setEditingAllocation(allocation);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setCurrentUser(null);
    setDashboard(null);
    setTransactions([]);
    setUserCards([]);
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
    setEmail("");
    setPassword("");
    setMessage("");
    setOverviewSubView("all");
    setTimeRangeFilter("ALL");
    setTransactionTypeFilter("ALL");
  };

  if (dashboard) {
    const filteredTransactions = transactions.filter((t) => {
      // 1. Transaction Type filter
      if (transactionTypeFilter === "INCOME" && t.type !== "INCOME") return false;
      if (transactionTypeFilter === "EXPENSE" && t.type !== "expense" && t.type !== "EXPENSE") return false;

      // 2. Custom Date Range filter
      if (isFiltered && startDate && endDate && t.date) {
        const tDate = String(t.date).split("T")[0];
        if (tDate < startDate || tDate > endDate) return false;
      } else if (timeRangeFilter === "THIS_MONTH" && t.date) {
        // 3. Calendar "This Month" filter
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed
        const parts = String(t.date).split("T")[0].split("-");
        if (parts.length >= 2) {
          const tYear = parseInt(parts[0], 10);
          const tMonth = parseInt(parts[1], 10) - 1;
          if (tYear !== currentYear || tMonth !== currentMonth) return false;
        }
      }

      // 4. Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (t.description || "").toLowerCase().includes(q);
        const catMatch = (t.category || "").toLowerCase().includes(q);
        const srcMatch = (t.source || "").toLowerCase().includes(q);
        const methodMatch = (t.payment_method || "").toLowerCase().includes(q);
        const amtMatch = String(t.amount || "").includes(q);
        if (!descMatch && !catMatch && !srcMatch && !methodMatch && !amtMatch) {
          return false;
        }
      }
      return true;
    });

    const netFilteredSum = filteredTransactions.reduce((acc, t) => {
      const isInc = t.type === "INCOME";
      const val = Number(t.amount) || 0;
      return isInc ? acc + val : acc - val;
    }, 0);

    const inflowFilteredSum = filteredTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const outflowFilteredSum = filteredTransactions
      .filter((t) => t.type !== "INCOME")
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const paymentMethodsBreakdown = {};
    transactions.forEach((t) => {
      const method = t.payment_method || t.source || "Checking / Cash";
      if (!paymentMethodsBreakdown[method]) {
        paymentMethodsBreakdown[method] = {
          name: method,
          inflow: 0,
          outflow: 0,
          count: 0,
        };
      }
      const amt = Number(t.amount) || 0;
      if (t.type === "INCOME") {
        paymentMethodsBreakdown[method].inflow += amt;
      } else {
        paymentMethodsBreakdown[method].outflow += amt;
      }
      paymentMethodsBreakdown[method].count += 1;
    });
    const paymentMethodsList = Object.values(paymentMethodsBreakdown);

    const renderTransactionsTable = (items = filteredTransactions) => {
      if (items.length === 0) {
        return (
          <div className="empty-state-box">
            <span className="empty-state-icon">📋</span>
            <p className="empty-state-text">
              {searchQuery
                ? `No records match "${searchQuery}".`
                : "No transactions found for the selected view."}
            </p>
          </div>
        );
      }
      return (
        <div className="transactions-table-container">
          <table className="notion-database-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Aa Name</th>
                <th style={{ width: "16%" }}>Amount</th>
                <th style={{ width: "18%" }}>Category</th>
                <th style={{ width: "16%" }}>Date</th>
                <th style={{ width: "15%" }}>Account / Method</th>
                <th style={{ width: "40px", textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t, idx) => {
                const isInc = t.type === "INCOME";
                return (
                  <tr
                    key={`${t.type}-${t.id}-${idx}`}
                    className={isInc ? "row-income" : "row-expense"}
                  >
                    <td>
                      <div className="name-cell-wrap">
                        <span className={`direction-badge ${isInc ? "dir-in" : "dir-out"}`}>
                          {isInc ? "↓" : "↑"}
                        </span>
                        <span className="name-cell-text" title={t.description || t.category}>
                          {t.description || `${t.category} ${isInc ? "Credit" : "Expense"}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`amount-text ${isInc ? "amount-in" : "amount-out"}`}>
                        {isInc ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="category-pill-tag">
                        <span className="category-emoji">{getCategoryIcon(t.category)}</span>
                        <span className="category-label-text">{t.category || "General"}</span>
                      </span>
                    </td>
                    <td className="date-cell-text">
                      {formatDateClean(t.date)}
                    </td>
                    <td>
                      <span className="account-cell-tag">
                        👤 {t.payment_method || t.source || "Checking"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteTransaction(t)}
                        className="notion-row-delete-btn"
                        title="Delete record"
                        type="button"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    return (
      <div className="notion-app-layout">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        {/* SIDEBAR BACKDROP FOR MOBILE */}
        {sidebarOpen && (
          <div
            className="notion-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* NOTION LEFT SIDEBAR */}
        <aside className={`notion-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="notion-sidebar-header">
            <div className="notion-brand-group">
              <span className="notion-brand-icon">💼</span>
              <div className="notion-brand-text">
                <span className="notion-brand-title">FinTrack</span>
                <span className="notion-brand-subtitle">Personal Finance</span>
              </div>
            </div>
            <button
              className="notion-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="notion-sidebar-content">
            {/* 1. ACTIONS */}
            <div className="notion-nav-group">
              <div className="notion-group-heading">Actions</div>
              <button
                className="notion-action-btn action-income"
                onClick={() => { setShowIncomeForm(true); setSidebarOpen(false); }}
                type="button"
              >
                <span className="action-arrow">↓</span> New Income
              </button>
              <button
                className="notion-action-btn action-expense"
                onClick={() => { setShowExpenseForm(true); setSidebarOpen(false); }}
                type="button"
              >
                <span className="action-arrow">↑</span> New Expense
              </button>
              <button
                className="notion-action-btn action-budget"
                onClick={() => { setShowBudgetForm(true); setSidebarOpen(false); }}
                type="button"
              >
                <span className="action-arrow">+</span> New Budget
              </button>
            </div>

            {/* 2. DASHBOARDS */}
            <div className="notion-nav-group">
              <div className="notion-group-heading">Dashboards</div>
              <button
                className={`notion-nav-item ${activeTab === "overview" && overviewSubView === "all" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("overview");
                  setOverviewSubView("all");
                  setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="nav-icon">★</span> Overview
              </button>
            </div>

            {/* 3. ACCOUNTING */}
            <div className="notion-nav-group">
              <div className="notion-group-heading">Accounting</div>
              <button
                className={`notion-nav-item ${activeTab === "overview" && overviewSubView === "transactions" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("overview");
                  setOverviewSubView("transactions");
                  setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="nav-icon">⇄</span> Transactions
              </button>
              <button
                className={`notion-nav-item ${activeTab === "overview" && overviewSubView === "budgets" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("overview");
                  setOverviewSubView("budgets");
                  setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="nav-icon">💳</span> Budgets
              </button>
              <button
                className={`notion-nav-item ${activeTab === "overview" && overviewSubView === "allocations" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("overview");
                  setOverviewSubView("allocations");
                  setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="nav-icon">📑</span> Allocations
              </button>
              <button
                className={`notion-nav-item ${activeTab === "overview" && overviewSubView === "splits" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("overview");
                  setOverviewSubView("splits");
                  setSidebarOpen(false);
                }}
                type="button"
              >
                <span className="nav-icon">👥</span> Split Bills
              </button>
            </div>

            {/* 4. WEALTH & TOOLS */}
            <div className="notion-nav-group">
              <div className="notion-group-heading">Wealth & Tools</div>
              <button
                className={`notion-nav-item ${activeTab === "cards" ? "active" : ""}`}
                onClick={() => { setActiveTab("cards"); setSidebarOpen(false); }}
                type="button"
              >
                <span className="nav-icon">💳</span> Cards & Rewards
              </button>
              <button
                className={`notion-nav-item ${activeTab === "reports" ? "active" : ""}`}
                onClick={() => { setActiveTab("reports"); setSidebarOpen(false); }}
                type="button"
              >
                <span className="nav-icon">📄</span> Financial Statement
              </button>
              <button
                className={`notion-nav-item ${activeTab === "assistant" ? "active" : ""}`}
                onClick={() => { setActiveTab("assistant"); setSidebarOpen(false); }}
                type="button"
              >
                <span className="nav-icon">🤖</span> AI Finance Assistant
              </button>
              <button
                className={`notion-nav-item ${activeTab === "sms" ? "active" : ""}`}
                onClick={() => { setActiveTab("sms"); setSidebarOpen(false); }}
                type="button"
              >
                <span className="nav-icon">📱</span> Bank SMS Importer
              </button>
              {currentUser?.role === "DEVELOPER" && (
                <button
                  className={`notion-nav-item dev-item ${activeTab === "developer" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("developer");
                    setSidebarOpen(false);
                    const token = localStorage.getItem("access_token");
                    if (token) fetchDeveloperData(token);
                  }}
                  type="button"
                >
                  <span className="nav-icon">🛠️</span> Developer Console
                </button>
              )}
            </div>
          </div>

          {/* USER FOOTER PROFILE */}
          <div className="notion-sidebar-footer">
            <div className="notion-user-chip">
              <div className="user-avatar-circle">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info-text">
                <span className="user-name-text">{currentUser?.name || "User"}</span>
                <span className="user-role-badge">{currentUser?.role || "USER"}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="notion-sidebar-logout-btn"
              title="Sign Out"
              type="button"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* NOTION MAIN WORKSPACE */}
        <div className="notion-workspace">
          {/* TOPBAR */}
          <header className="notion-topbar">
            <div className="notion-topbar-left">
              <button
                className="notion-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Toggle menu"
                type="button"
              >
                ☰
              </button>
              <div className="notion-breadcrumbs">
                <span className="bc-root">FinTrack</span>
                <span className="bc-sep">/</span>
                <span className="bc-current">
                  {activeTab === "overview" && (
                    overviewSubView === "all" ? "Dashboard" :
                    overviewSubView === "accounts" ? "Accounts & Instruments" :
                    overviewSubView === "category" ? "Spending Visualization" :
                    overviewSubView === "transactions" ? "Transactions" :
                    overviewSubView === "budgets" ? "Budget Management" :
                    overviewSubView === "allocations" ? "Income Allocations" :
                    overviewSubView === "splits" ? "Split Bills" :
                    overviewSubView.toUpperCase()
                  )}
                  {activeTab === "cards" && "Cards & Rewards"}
                  {activeTab === "reports" && "Financial Statements"}
                  {activeTab === "assistant" && "AI Finance Assistant"}
                  {activeTab === "sms" && "Bank SMS Importer"}
                  {activeTab === "developer" && "Developer Console"}
                </span>
              </div>
            </div>

            <div className="notion-topbar-right">
              {/* Date Filter Toggle */}
              <button
                className={`notion-filter-btn ${showDateFilter || isFiltered ? "active" : ""}`}
                onClick={() => setShowDateFilter(!showDateFilter)}
                type="button"
              >
                📅 {isFiltered ? `${startDate} → ${endDate}` : "Date Filter"}
              </button>

              {/* Notifications */}
              <div style={{ position: "relative" }}>
                <button
                  className="notification-bell-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                  type="button"
                >
                  🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="mark-all-read-btn"
                          type="button"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>
                    <div className="notifications-body">
                      {notifications.length === 0 ? (
                        <p className="notifications-empty">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.notification_id}
                            className={`notification-item ${n.is_read ? "read" : "unread"}`}
                          >
                            <div className="notification-item-header">
                              <strong>{n.title}</strong>
                              {!n.is_read && (
                                <button
                                  onClick={() => handleMarkNotificationRead(n.notification_id)}
                                  className="mark-read-btn"
                                  type="button"
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>
                            <p>{n.message}</p>
                            <small>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleLogout} className="topbar-logout-btn" type="button">
                Logout
              </button>
            </div>
          </header>

          {/* COLLAPSIBLE DATE FILTER PANEL */}
          {showDateFilter && (
            <div className="notion-date-filter-panel">
              <div className="panel-title-row">
                <span>Filter Financial Records by Custom Date Range</span>
                <button
                  onClick={() => setShowDateFilter(false)}
                  className="panel-close-btn"
                  type="button"
                >
                  ✕
                </button>
              </div>
              <div className="panel-inputs-row">
                <div className="filter-input-col">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="filter-input-col">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <button onClick={handleApplyFilter} className="filter-apply-btn" type="button">
                  Apply Filter
                </button>
                {isFiltered && (
                  <button onClick={handleClearFilter} className="filter-clear-btn" type="button">
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FEEDBACK MESSAGE */}
          {message && (
            <div className="notion-toast-banner">
              <span>{message}</span>
              <button onClick={() => setMessage("")} className="toast-dismiss-btn" type="button">
                ✕
              </button>
            </div>
          )}

          {/* MAIN VIEW CONTENT */}
          <main className="notion-content-area">
            {/* DEVELOPER CONSOLE */}
            {activeTab === "developer" && currentUser?.role === "DEVELOPER" && (
              <div className="developer-section">
                <div className="section-header">
                  <div>
                    <h2>Developer Operational Console</h2>
                    <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                      System metrics & audit trail. Role: <strong>DEVELOPER</strong>. Private financial data and user credentials remain strictly protected.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("access_token");
                      if (token) fetchDeveloperData(token);
                    }}
                    className="notion-btn-primary"
                    type="button"
                  >
                    🔄 Refresh Logs
                  </button>
                </div>

                {developerStats && (
                  <div className="notion-kpi-grid" style={{ marginBottom: "25px" }}>
                    <div className="kpi-card kpi-total-balance">
                      <div className="kpi-header">
                        <span className="kpi-icon">👥</span>
                        <span className="kpi-label">Registered Users</span>
                      </div>
                      <div className="kpi-value">{developerStats.total_users}</div>
                    </div>
                    <div className="kpi-card kpi-net-income">
                      <div className="kpi-header">
                        <span className="kpi-icon">📥</span>
                        <span className="kpi-label">Income Records</span>
                      </div>
                      <div className="kpi-value">{developerStats.total_income_records}</div>
                    </div>
                    <div className="kpi-card kpi-credit-cards">
                      <div className="kpi-header">
                        <span className="kpi-icon">📤</span>
                        <span className="kpi-label">Expense Records</span>
                      </div>
                      <div className="kpi-value">{developerStats.total_expense_records}</div>
                    </div>
                    <div className="kpi-card kpi-left-month">
                      <div className="kpi-header">
                        <span className="kpi-icon">🎯</span>
                        <span className="kpi-label">Budgets Configured</span>
                      </div>
                      <div className="kpi-value">{developerStats.total_budgets}</div>
                    </div>
                  </div>
                )}

                <div className="notion-card-panel">
                  <h3 style={{ marginBottom: "15px", color: "#f3f4f6" }}>System Audit Trail</h3>
                  {developerAuditLogs.length === 0 ? (
                    <p style={{ color: "#9ca3af" }}>No audit log entries recorded.</p>
                  ) : (
                    <div className="transactions-table-container">
                      <table className="notion-database-table">
                        <thead>
                          <tr>
                            <th>Log ID</th>
                            <th>User ID</th>
                            <th>Action</th>
                            <th>Entity Type</th>
                            <th>Entity ID</th>
                            <th>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {developerAuditLogs.map((log) => (
                            <tr key={log.log_id}>
                              <td>#{log.log_id}</td>
                              <td>User {log.user_id || "System"}</td>
                              <td>
                                <span className="notion-tag tag-indigo">
                                  {log.action}
                                </span>
                              </td>
                              <td>{log.entity_type || "-"}</td>
                              <td>{log.entity_id ? `#${log.entity_id}` : "-"}</td>
                              <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARDS TAB */}
            {activeTab === "cards" && (
              <CardsManager
                API_URL={API_URL}
                token={localStorage.getItem("access_token")}
                expenses={transactions.filter((t) => t.type === "expense" || t.type === "EXPENSE")}
                onRefreshExpenses={() => {
                  const t = localStorage.getItem("access_token");
                  if (t) fetchTransactions(t);
                }}
              />
            )}

            {/* REPORTS TAB */}
            {activeTab === "reports" && (
              <FinancialReports
                API_URL={API_URL}
                token={localStorage.getItem("access_token")}
                initialStartDate={startDate}
                initialEndDate={endDate}
              />
            )}

            {/* AI ASSISTANT TAB */}
            {activeTab === "assistant" && (
              <AIAssistant
                API_URL={API_URL}
                token={localStorage.getItem("access_token")}
              />
            )}

            {/* SMS IMPORTER TAB */}
            {activeTab === "sms" && (
              <SMSImporter
                API_URL={API_URL}
                token={localStorage.getItem("access_token")}
                onTransactionAdded={() => {
                  const t = localStorage.getItem("access_token");
                  if (t) {
                    fetchDashboard(t);
                    fetchTransactions(t);
                    fetchExpenseSummary(t);
                  }
                }}
              />
            )}

            {/* OVERVIEW DASHBOARD */}
            {activeTab === "overview" && (
              <>
                {/* 1. MASTER OVERVIEW (overviewSubView === "all") */}
                {overviewSubView === "all" && (
                  <>
                    <section className="notion-section accounts-section">
                      <div className="notion-section-header">
                        <div className="section-title-wrap">
                          <h2 className="notion-section-heading">Accounts</h2>
                          <div className="notion-subtabs">
                            <button
                              className="subtab-pill active"
                              onClick={() => setOverviewSubView("all")}
                              type="button"
                            >
                              ★ Overview
                            </button>
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("accounts")}
                              type="button"
                            >
                              🏛️ Accounts
                            </button>
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("category")}
                              type="button"
                            >
                              📈 Spending Chart
                            </button>
                          </div>
                        </div>

                        <div className="section-actions-wrap">
                          <button
                            className="notion-pill-action"
                            onClick={() => setShowExpenseForm(true)}
                            type="button"
                          >
                            + New
                          </button>
                        </div>
                      </div>

                      {/* 4 Notion KPI Cards with tailored dark tints */}
                      <div className="notion-kpi-grid">
                        <div className="kpi-card kpi-total-balance">
                          <div className="kpi-header">
                            <span className="kpi-icon">✪</span>
                            <span className="kpi-label">Total Balance</span>
                          </div>
                          <div className="kpi-value">
                            {formatCurrency(dashboard.balance)}
                          </div>
                          <div className="kpi-subtext">Net liquid assets</div>
                        </div>

                        <div className="kpi-card kpi-credit-cards">
                          <div className="kpi-header">
                            <span className="kpi-icon">💳</span>
                            <span className="kpi-label">Total Outflow</span>
                          </div>
                          <div className="kpi-value">
                            {formatCurrency(dashboard.total_expenses)}
                          </div>
                          <div className="kpi-subtext">
                            {dashboard.transaction_count ? `${dashboard.transaction_count} transactions recorded` : "Cumulative expense"}
                          </div>
                        </div>

                        <div className="kpi-card kpi-left-month">
                          <div className="kpi-header">
                            <span className="kpi-icon">🗂️</span>
                            <span className="kpi-label">Left this Month</span>
                          </div>
                          <div className="kpi-value">
                            {monthlyAnalytics?.balance != null
                              ? formatCurrency(monthlyAnalytics.balance)
                              : formatCurrency(dashboard.balance)}
                          </div>
                          <div className="kpi-subtext">
                            {monthlyComparison?.comparison?.expenses?.percentage_change != null
                              ? `${monthlyComparison.comparison.expenses.percentage_change}% vs previous month`
                              : "Current month margin"}
                          </div>
                        </div>

                        <div className="kpi-card kpi-net-income">
                          <div className="kpi-header">
                            <span className="kpi-icon">💵</span>
                            <span className="kpi-label">Monthly Net Income</span>
                          </div>
                          <div className="kpi-value">
                            {monthlyAnalytics?.total_income != null
                              ? formatCurrency(monthlyAnalytics.total_income)
                              : formatCurrency(dashboard.total_income)}
                          </div>
                          <div className="kpi-subtext">
                            {monthlyAnalytics?.savings_rate_percent != null
                              ? `Savings Rate: ${monthlyAnalytics.savings_rate_percent}%`
                              : "Monthly gross inflow"}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Database Section (Recent Transactions Preview) */}
                    <section className="notion-section database-section">
                      <div className="notion-section-header">
                        <div className="section-title-wrap">
                          <h2 className="notion-section-heading">Income & Expenses</h2>
                          <div className="notion-subtabs">
                            <button
                              className={`subtab-pill ${timeRangeFilter === "THIS_MONTH" ? "active" : ""}`}
                              onClick={() => setTimeRangeFilter("THIS_MONTH")}
                              type="button"
                              title="Filter to current calendar month"
                            >
                              📅 This Month
                            </button>
                            <button
                              className={`subtab-pill ${timeRangeFilter === "ALL" && transactionTypeFilter === "ALL" ? "active" : ""}`}
                              onClick={() => {
                                setTimeRangeFilter("ALL");
                                setTransactionTypeFilter("ALL");
                              }}
                              type="button"
                              title="Show all transactions"
                            >
                              ⇄ All Time
                            </button>
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("budgets")}
                              type="button"
                              title="Open Budget Management"
                            >
                              🎯 Monthly Budget
                            </button>
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("category")}
                              type="button"
                              title="Open Spending Chart"
                            >
                              📊 Categories
                            </button>
                            <button
                              className={`subtab-pill ${transactionTypeFilter === "INCOME" ? "active" : ""}`}
                              onClick={() => {
                                setTransactionTypeFilter(transactionTypeFilter === "INCOME" ? "ALL" : "INCOME");
                              }}
                              type="button"
                              title="Filter to Income records"
                            >
                              ↓ Income
                            </button>
                            <button
                              className={`subtab-pill ${transactionTypeFilter === "EXPENSE" ? "active" : ""}`}
                              onClick={() => {
                                setTransactionTypeFilter(transactionTypeFilter === "EXPENSE" ? "ALL" : "EXPENSE");
                              }}
                              type="button"
                              title="Filter to Expense records"
                            >
                              ↑ Expenses
                            </button>
                          </div>
                        </div>

                        <div className="database-controls-wrap">
                          <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                              type="text"
                              placeholder="Filter records..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery("")}
                                className="clear-search-btn"
                                type="button"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <button
                            className="notion-pill-action"
                            onClick={() => setShowExpenseForm(true)}
                            type="button"
                          >
                            + New
                          </button>
                        </div>
                      </div>

                      <div className="notion-table-card">
                        {renderTransactionsTable(filteredTransactions.slice(0, 8))}
                        <div className="notion-table-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "20px" }}>
                            <div className="footer-metric">
                              <span className="footer-label">COUNT</span>
                              <span className="footer-value">{filteredTransactions.length}</span>
                            </div>
                            <div className="footer-metric">
                              <span className="footer-label">NET</span>
                              <span className="footer-value">
                                {netFilteredSum >= 0 ? "+" : ""}{formatCurrency(netFilteredSum)}
                              </span>
                            </div>
                          </div>
                          <button
                            className="notion-pill-action"
                            onClick={() => setOverviewSubView("transactions")}
                            type="button"
                            style={{ fontSize: "12px", padding: "4px 12px" }}
                          >
                            View Full History ({filteredTransactions.length}) ⇄
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Two-Column Analytics Grid */}
                    <div className="dashboard-analytics-grid">
                      {/* Column 1: Monthly Spending by Category */}
                      <div className="dashboard-card category-spending-card">
                        <div className="card-header-flex">
                          <div>
                            <h2 className="card-title">Monthly Spending by Category</h2>
                            <p className="card-subtitle">Breakdown of personal and shared liabilities</p>
                          </div>
                          {categoryAnalysis && Number(categoryAnalysis.total_expenses) > 0 && (
                            <div className="total-spending-badge">
                              <span className="total-spending-label">Total Outflow</span>
                              <span className="total-spending-val">
                                {formatCurrency(categoryAnalysis.total_expenses)}
                              </span>
                            </div>
                          )}
                        </div>

                        {!categoryAnalysis ? (
                          <div className="empty-state-box">
                            <span className="empty-state-icon">📊</span>
                            <p className="empty-state-text">Loading monthly spending breakdown...</p>
                          </div>
                        ) : categoryAnalysis.categories.length === 0 ? (
                          <div className="empty-state-box">
                            <span className="empty-state-icon">📊</span>
                            <p className="empty-state-text">No category spending recorded for this month.</p>
                          </div>
                        ) : (
                          <div className="category-spending-list">
                            {categoryAnalysis.categories.map((item) => {
                              const clampedPct = Math.min(Math.max(Number(item.percentage) || 0, 0), 100);
                              return (
                                <div className="category-spending-row" key={item.category}>
                                  <div className="category-meta">
                                    <span className="category-icon" aria-hidden="true">
                                      {getCategoryIcon(item.category)}
                                    </span>
                                    <span className="category-name" title={item.category}>
                                      {item.category}
                                    </span>
                                    <div className="category-amount-group">
                                      <span className="category-amount">
                                        {formatCurrency(item.amount)}
                                      </span>
                                      <span className="category-percentage">
                                        {Number(item.percentage).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="category-bar-track">
                                    <div
                                      className="category-bar-fill"
                                      style={{ width: `${clampedPct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Column 2: Budget Alerts & Threshold Health */}
                      <div className="dashboard-card budget-alerts-card">
                        <div className="card-header-flex">
                          <div>
                            <h2 className="card-title">Budget Alerts</h2>
                            <p className="card-subtitle">Active category limits and threshold health</p>
                          </div>
                          {budgetAlerts.length > 0 && (
                            <span className="active-budgets-count">
                              {budgetAlerts.length} {budgetAlerts.length === 1 ? "Active Budget" : "Active Budgets"}
                            </span>
                          )}
                        </div>

                        {budgetAlerts.length === 0 ? (
                          <div className="empty-state-box">
                            <span className="empty-state-icon">🎯</span>
                            <p className="empty-state-text">No budget limits configured. Add a budget to monitor spending health.</p>
                          </div>
                        ) : (
                          <div className="budget-alerts-grid">
                            {budgetAlerts.map((alert) => {
                              const matchingBudget = budgets.find((b) => b.budget_id === alert.budget_id);
                              const periodLabel = matchingBudget?.period || (alert.period ? alert.period : "");
                              const dateRangeLabel = matchingBudget?.start_date && matchingBudget?.end_date
                                ? `${matchingBudget.start_date} to ${matchingBudget.end_date}`
                                : null;
                              const statusInfo = getBudgetStatusInfo(alert);
                              const clampedProgress = Math.min(Math.max(Number(alert.utilization_percentage) || 0, 0), 100);
                              const isOver = Number(alert.remaining) < 0 || alert.status === "OVER_BUDGET";

                              return (
                                <div className="budget-single-card" key={alert.budget_id}>
                                  <div className="budget-card-header">
                                    <div>
                                      <div className="budget-category-title">
                                        <span className="category-icon" style={{ fontSize: "16px", marginRight: "6px" }}>
                                          {getCategoryIcon(alert.category)}
                                        </span>
                                        <strong>{alert.category}</strong>
                                      </div>
                                      <div className="budget-period-tag">
                                        {periodLabel ? periodLabel.toUpperCase() : "BUDGET"}
                                        {dateRangeLabel ? ` • ${dateRangeLabel}` : ""}
                                      </div>
                                    </div>

                                    <span className={`budget-status-badge ${statusInfo.badgeClass}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>

                                  <div className="budget-figures-row">
                                    <span className="budget-spent-text">
                                      Spent: <strong>{formatCurrency(alert.spent)}</strong>
                                    </span>
                                    <span className="budget-limit-text">
                                      Limit: {formatCurrency(alert.budget_limit)}
                                    </span>
                                  </div>

                                  <div className="budget-bar-track">
                                    <div
                                      className={`budget-bar-fill ${statusInfo.barClass}`}
                                      style={{ width: `${clampedProgress}%` }}
                                    />
                                  </div>

                                  <div className="budget-footer-row">
                                    <span className="budget-util-pct">
                                      {Number(alert.utilization_percentage).toFixed(1)}% used
                                    </span>
                                    <span className={`budget-remaining-text ${isOver ? "text-danger" : "text-success"}`}>
                                      {isOver
                                        ? `${formatCurrency(Math.abs(Number(alert.remaining)))} over budget`
                                        : `${formatCurrency(alert.remaining)} remaining`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Management Panels for Budgets, Allocations, and Splits */}
                    <div className="dashboard-analytics-grid" style={{ marginTop: "24px" }}>
                      <div className="dashboard-card">
                        <div className="card-header-flex">
                          <div>
                            <h3 className="card-title">Configured Budgets</h3>
                            <p className="card-subtitle">{budgetSummary.length} active categories monitored</p>
                          </div>
                          <button
                            className="notion-pill-action"
                            onClick={() => setOverviewSubView("budgets")}
                            type="button"
                          >
                            Manage Budgets 💳
                          </button>
                        </div>
                      </div>

                      <div className="dashboard-card">
                        <div className="card-header-flex">
                          <div>
                            <h3 className="card-title">Shared Liabilities & Commitments</h3>
                            <p className="card-subtitle">{allocations.length} planned allocations • {splitBills.length} split bills</p>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="notion-pill-action"
                              onClick={() => setOverviewSubView("allocations")}
                              type="button"
                            >
                              Allocations 📑
                            </button>
                            <button
                              className="notion-pill-action"
                              onClick={() => setOverviewSubView("splits")}
                              type="button"
                            >
                              Split Bills 👥
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. ACCOUNTS VIEW (overviewSubView === "accounts") */}
                {overviewSubView === "accounts" && (
                  <>
                    <section className="notion-section accounts-section">
                      <div className="notion-section-header">
                        <div className="section-title-wrap">
                          <h2 className="notion-section-heading">Accounts</h2>
                          <div className="notion-subtabs">
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("all")}
                              type="button"
                            >
                              ★ Overview
                            </button>
                            <button
                              className="subtab-pill active"
                              onClick={() => setOverviewSubView("accounts")}
                              type="button"
                            >
                              🏛️ Accounts
                            </button>
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("category")}
                              type="button"
                            >
                              📈 Spending Chart
                            </button>
                          </div>
                        </div>

                        <div className="section-actions-wrap">
                          <button
                            className="notion-pill-action"
                            onClick={() => setShowExpenseForm(true)}
                            type="button"
                          >
                            + New Expense
                          </button>
                        </div>
                      </div>

                      <div className="notion-kpi-grid">
                        <div className="kpi-card kpi-total-balance">
                          <div className="kpi-header">
                            <span className="kpi-icon">✪</span>
                            <span className="kpi-label">Total Liquid Net</span>
                          </div>
                          <div className="kpi-value">{formatCurrency(dashboard.balance)}</div>
                          <div className="kpi-subtext">Cumulative liquid assets</div>
                        </div>
                        <div className="kpi-card kpi-net-income">
                          <div className="kpi-header">
                            <span className="kpi-icon">💵</span>
                            <span className="kpi-label">Total Gross Inflow</span>
                          </div>
                          <div className="kpi-value">{formatCurrency(dashboard.total_income)}</div>
                          <div className="kpi-subtext">All verified receipts</div>
                        </div>
                        <div className="kpi-card kpi-credit-cards">
                          <div className="kpi-header">
                            <span className="kpi-icon">💳</span>
                            <span className="kpi-label">Total Outflow</span>
                          </div>
                          <div className="kpi-value">{formatCurrency(dashboard.total_expenses)}</div>
                          <div className="kpi-subtext">All recorded disbursements</div>
                        </div>
                        <div className="kpi-card kpi-left-month">
                          <div className="kpi-header">
                            <span className="kpi-icon">🏦</span>
                            <span className="kpi-label">Active Instruments</span>
                          </div>
                          <div className="kpi-value">{paymentMethodsList.length}</div>
                          <div className="kpi-subtext">Payment channels & cards</div>
                        </div>
                      </div>
                    </section>

                    {/* Payment Instruments & Cashflow Movement Table */}
                    <div className="notion-card-panel" style={{ marginTop: "24px" }}>
                      <div className="section-header">
                        <div>
                          <h2>Payment Instruments & Cashflow Movement</h2>
                          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                            Breakdown of receipts and disbursements grouped by transaction payment method / source
                          </p>
                        </div>
                      </div>

                      {paymentMethodsList.length === 0 ? (
                        <p style={{ color: "#9ca3af" }}>No payment method records found.</p>
                      ) : (
                        <div className="transactions-table-container">
                          <table className="notion-database-table">
                            <thead>
                              <tr>
                                <th>Account / Payment Channel</th>
                                <th>Inflow (+)</th>
                                <th>Outflow (-)</th>
                                <th>Net Balance</th>
                                <th>Transactions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentMethodsList.map((pm) => {
                                const net = pm.inflow - pm.outflow;
                                return (
                                  <tr key={pm.name}>
                                    <td>
                                      <strong>{pm.name}</strong>
                                    </td>
                                    <td style={{ color: "#4ade80" }}>{formatCurrency(pm.inflow)}</td>
                                    <td style={{ color: "#f87171" }}>{formatCurrency(pm.outflow)}</td>
                                    <td style={{ color: net >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                                      {net >= 0 ? "+" : ""}{formatCurrency(net)}
                                    </td>
                                    <td>{pm.count} records</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Linked Cards & Instruments Summary */}
                    <div className="notion-card-panel" style={{ marginTop: "24px" }}>
                      <div className="section-header">
                        <div>
                          <h2>Linked Credit & Debit Cards</h2>
                          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                            Connected financial cards tracked in FinTrack
                          </p>
                        </div>
                        <button
                          className="notion-btn-primary"
                          onClick={() => setActiveTab("cards")}
                          type="button"
                        >
                          Open Cards Manager 💳
                        </button>
                      </div>

                      {userCards.length === 0 ? (
                        <div className="empty-state-box">
                          <span className="empty-state-icon">💳</span>
                          <p className="empty-state-text">No cards linked yet. Add cards in the Cards & Rewards tab.</p>
                        </div>
                      ) : (
                        <div className="budgets-grid">
                          {userCards.map((card) => (
                            <div className="budget-card" key={card.card_id}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3>💳 {card.card_name}</h3>
                                <span className="notion-tag">{card.card_type || "CARD"}</span>
                              </div>
                              <p><strong>Issuer:</strong> {card.issuer || "Bank"}</p>
                              <p><strong>Card Number:</strong> •••• •••• •••• {card.last_four_digits || "••••"}</p>
                              <p><strong>Network:</strong> {card.network || "Standard"}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Account Identity & Security Profile */}
                    <div className="notion-card-panel" style={{ marginTop: "24px" }}>
                      <div className="section-header">
                        <div>
                          <h2>Account Identity & Security Specification</h2>
                          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                            Cryptographic authentication and strict tenant data isolation
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px", marginTop: "10px" }}>
                        <div style={{ background: "#161616", padding: "14px", borderRadius: "8px", border: "1px solid #262626" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Account Holder</span>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginTop: "4px" }}>{currentUser?.name || "Active User"}</div>
                        </div>
                        <div style={{ background: "#161616", padding: "14px", borderRadius: "8px", border: "1px solid #262626" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Registered Email</span>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginTop: "4px" }}>{currentUser?.email || email}</div>
                        </div>
                        <div style={{ background: "#161616", padding: "14px", borderRadius: "8px", border: "1px solid #262626" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>System Role</span>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginTop: "4px" }}>{currentUser?.role || "USER"}</div>
                        </div>
                        <div style={{ background: "#161616", padding: "14px", borderRadius: "8px", border: "1px solid #262626" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Data Privacy</span>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#4ade80", marginTop: "4px" }}>Isolated Tenant Space</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. SPENDING CHART VIEW (overviewSubView === "category") */}
                {overviewSubView === "category" && (
                  <>
                    <section className="notion-section accounts-section">
                      <div className="notion-section-header">
                        <div className="section-title-wrap">
                          <h2 className="notion-section-heading">Accounts</h2>
                          <div className="notion-subtabs">
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("all")}
                              type="button"
                            >
                              ★ Overview
                            </button>
                            <button
                              className="subtab-pill"
                              onClick={() => setOverviewSubView("accounts")}
                              type="button"
                            >
                              🏛️ Accounts
                            </button>
                            <button
                              className="subtab-pill active"
                              onClick={() => setOverviewSubView("category")}
                              type="button"
                            >
                              📈 Spending Chart
                            </button>
                          </div>
                        </div>

                        <div className="section-actions-wrap">
                          <button
                            className="notion-pill-action"
                            onClick={() => setShowExpenseForm(true)}
                            type="button"
                          >
                            + New Expense
                          </button>
                        </div>
                      </div>

                      <div className="notion-kpi-grid">
                        <div className="kpi-card kpi-credit-cards">
                          <div className="kpi-header">
                            <span className="kpi-icon">💳</span>
                            <span className="kpi-label">Monthly Outflow</span>
                          </div>
                          <div className="kpi-value">
                            {categoryAnalysis ? formatCurrency(categoryAnalysis.total_expenses) : formatCurrency(dashboard.total_expenses)}
                          </div>
                          <div className="kpi-subtext">Total category expenses</div>
                        </div>
                        <div className="kpi-card kpi-left-month">
                          <div className="kpi-header">
                            <span className="kpi-icon">📈</span>
                            <span className="kpi-label">Previous Month Change</span>
                          </div>
                          <div className="kpi-value">
                            {monthlyComparison?.comparison?.expenses?.percentage_change != null
                              ? `${monthlyComparison.comparison.expenses.percentage_change}%`
                              : "0.0%"}
                          </div>
                          <div className="kpi-subtext">Monthly variance</div>
                        </div>
                        <div className="kpi-card kpi-net-income">
                          <div className="kpi-header">
                            <span className="kpi-icon">📊</span>
                            <span className="kpi-label">Categories Tracked</span>
                          </div>
                          <div className="kpi-value">
                            {categoryAnalysis?.categories ? categoryAnalysis.categories.length : 0}
                          </div>
                          <div className="kpi-subtext">Active spending areas</div>
                        </div>
                        <div className="kpi-card kpi-total-balance">
                          <div className="kpi-header">
                            <span className="kpi-icon">💰</span>
                            <span className="kpi-label">Savings Rate</span>
                          </div>
                          <div className="kpi-value">
                            {monthlyAnalytics?.savings_rate_percent != null
                              ? `${monthlyAnalytics.savings_rate_percent}%`
                              : "0.0%"}
                          </div>
                          <div className="kpi-subtext">Net retained income</div>
                        </div>
                      </div>
                    </section>

                    {/* Category Breakdown Progress Bars */}
                    <div className="dashboard-card category-spending-card" style={{ marginTop: "24px" }}>
                      <div className="card-header-flex">
                        <div>
                          <h2 className="card-title">Monthly Spending Distribution by Category</h2>
                          <p className="card-subtitle">Visual expenditure breakdown with exact decimal allocations</p>
                        </div>
                      </div>

                      {!categoryAnalysis ? (
                        <div className="empty-state-box">
                          <span className="empty-state-icon">📊</span>
                          <p className="empty-state-text">Loading monthly spending breakdown...</p>
                        </div>
                      ) : categoryAnalysis.categories.length === 0 ? (
                        <div className="empty-state-box">
                          <span className="empty-state-icon">📊</span>
                          <p className="empty-state-text">No category spending recorded for this month.</p>
                        </div>
                      ) : (
                        <div className="category-spending-list">
                          {categoryAnalysis.categories.map((item) => {
                            const clampedPct = Math.min(Math.max(Number(item.percentage) || 0, 0), 100);
                            return (
                              <div className="category-spending-row" key={item.category}>
                                <div className="category-meta">
                                  <span className="category-icon" aria-hidden="true">
                                    {getCategoryIcon(item.category)}
                                  </span>
                                  <span className="category-name" title={item.category}>
                                    {item.category}
                                  </span>
                                  <div className="category-amount-group">
                                    <span className="category-amount">
                                      {formatCurrency(item.amount)}
                                    </span>
                                    <span className="category-percentage">
                                      {Number(item.percentage).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="category-bar-track">
                                  <div
                                    className="category-bar-fill"
                                    style={{ width: `${clampedPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Category Expense Transactions */}
                    <section className="notion-section database-section" style={{ marginTop: "24px" }}>
                      <div className="notion-section-header">
                        <div>
                          <h2 className="notion-section-heading">Category Expense Records</h2>
                          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                            All recorded disbursements sorted by date and category
                          </p>
                        </div>
                        <div className="database-controls-wrap">
                          <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                              type="text"
                              placeholder="Filter by category or merchant..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button onClick={() => setSearchQuery("")} className="clear-search-btn" type="button">✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="notion-table-card">
                        {renderTransactionsTable(filteredTransactions.filter((t) => t.type !== "INCOME"))}
                      </div>
                    </section>
                  </>
                )}

                {/* 4. DEDICATED TRANSACTIONS VIEW (overviewSubView === "transactions") */}
                {overviewSubView === "transactions" && (
                  <section className="notion-section database-section">
                    <div className="notion-section-header">
                      <div className="section-title-wrap">
                        <h2 className="notion-section-heading">Transaction History</h2>
                        <div className="notion-subtabs">
                          <button
                            className={`subtab-pill ${timeRangeFilter === "THIS_MONTH" ? "active" : ""}`}
                            onClick={() => setTimeRangeFilter("THIS_MONTH")}
                            type="button"
                            title="Filter to current calendar month"
                          >
                            📅 This Month
                          </button>
                          <button
                            className={`subtab-pill ${timeRangeFilter === "ALL" && transactionTypeFilter === "ALL" ? "active" : ""}`}
                            onClick={() => {
                              setTimeRangeFilter("ALL");
                              setTransactionTypeFilter("ALL");
                            }}
                            type="button"
                            title="Show all transactions"
                          >
                            ⇄ All Time
                          </button>
                          <button
                            className="subtab-pill"
                            onClick={() => setOverviewSubView("budgets")}
                            type="button"
                            title="Open Budget Management"
                          >
                            🎯 Monthly Budget
                          </button>
                          <button
                            className="subtab-pill"
                            onClick={() => setOverviewSubView("category")}
                            type="button"
                            title="Open Spending Chart"
                          >
                            📊 Categories
                          </button>
                          <button
                            className={`subtab-pill ${transactionTypeFilter === "INCOME" ? "active" : ""}`}
                            onClick={() => {
                              setTransactionTypeFilter(transactionTypeFilter === "INCOME" ? "ALL" : "INCOME");
                            }}
                            type="button"
                            title="Filter to Income records"
                          >
                            ↓ Income
                          </button>
                          <button
                            className={`subtab-pill ${transactionTypeFilter === "EXPENSE" ? "active" : ""}`}
                            onClick={() => {
                              setTransactionTypeFilter(transactionTypeFilter === "EXPENSE" ? "ALL" : "EXPENSE");
                            }}
                            type="button"
                            title="Filter to Expense records"
                          >
                            ↑ Expenses
                          </button>
                        </div>
                      </div>
                      <div className="database-controls-wrap">
                        <div className="search-box">
                          <span className="search-icon">🔍</span>
                          <input
                            type="text"
                            placeholder="Search description, category, payment method..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="clear-search-btn" type="button">✕</button>
                          )}
                        </div>
                        <button
                          className="notion-pill-action"
                          onClick={() => setShowExpenseForm(true)}
                          type="button"
                        >
                          + New Expense
                        </button>
                        <button
                          className="notion-pill-action"
                          onClick={() => setShowIncomeForm(true)}
                          type="button"
                        >
                          + New Income
                        </button>
                      </div>
                    </div>

                    {/* Strip of Summary Metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ background: "#161616", padding: "12px 16px", borderRadius: "8px", border: "1px solid #262626" }}>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>TOTAL RECORDS</span>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>{filteredTransactions.length}</div>
                      </div>
                      <div style={{ background: "#161616", padding: "12px 16px", borderRadius: "8px", border: "1px solid #262626" }}>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>TOTAL INFLOW</span>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#4ade80", marginTop: "4px" }}>+{formatCurrency(inflowFilteredSum)}</div>
                      </div>
                      <div style={{ background: "#161616", padding: "12px 16px", borderRadius: "8px", border: "1px solid #262626" }}>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>TOTAL OUTFLOW</span>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f87171", marginTop: "4px" }}>-{formatCurrency(outflowFilteredSum)}</div>
                      </div>
                      <div style={{ background: "#161616", padding: "12px 16px", borderRadius: "8px", border: "1px solid #262626" }}>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>NET BALANCE</span>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: netFilteredSum >= 0 ? "#4ade80" : "#f87171", marginTop: "4px" }}>
                          {netFilteredSum >= 0 ? "+" : ""}{formatCurrency(netFilteredSum)}
                        </div>
                      </div>
                    </div>

                    <div className="notion-table-card">
                      {renderTransactionsTable(filteredTransactions)}
                    </div>
                  </section>
                )}

                {/* 5. DEDICATED BUDGETS VIEW (overviewSubView === "budgets") */}
                {overviewSubView === "budgets" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <div>
                        <h2 className="notion-section-heading">Budget Management & Thresholds</h2>
                        <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                          Real-time utilization monitoring and timeline boundary governance
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="notion-pill-action"
                          onClick={() => setOverviewSubView("all")}
                          type="button"
                        >
                          ★ Overview
                        </button>
                        <button
                          className="notion-btn-primary"
                          onClick={() => setShowBudgetForm(true)}
                          type="button"
                        >
                          + Add Budget
                        </button>
                      </div>
                    </div>

                    {/* Budget Alerts & Health */}
                    <div className="dashboard-card budget-alerts-card" style={{ marginBottom: "25px" }}>
                      <div className="card-header-flex">
                        <div>
                          <h2 className="card-title">Budget Alerts & Threshold Health</h2>
                          <p className="card-subtitle">Active category limits and threshold health</p>
                        </div>
                        {budgetAlerts.length > 0 && (
                          <span className="active-budgets-count">
                            {budgetAlerts.length} {budgetAlerts.length === 1 ? "Active Budget" : "Active Budgets"}
                          </span>
                        )}
                      </div>

                      {budgetAlerts.length === 0 ? (
                        <div className="empty-state-box">
                          <span className="empty-state-icon">🎯</span>
                          <p className="empty-state-text">No budget limits configured. Add a budget to monitor spending health.</p>
                        </div>
                      ) : (
                        <div className="budget-alerts-grid">
                          {budgetAlerts.map((alert) => {
                            const matchingBudget = budgets.find((b) => b.budget_id === alert.budget_id);
                            const periodLabel = matchingBudget?.period || (alert.period ? alert.period : "");
                            const dateRangeLabel = matchingBudget?.start_date && matchingBudget?.end_date
                              ? `${matchingBudget.start_date} to ${matchingBudget.end_date}`
                              : null;
                            const statusInfo = getBudgetStatusInfo(alert);
                            const clampedProgress = Math.min(Math.max(Number(alert.utilization_percentage) || 0, 0), 100);
                            const isOver = Number(alert.remaining) < 0 || alert.status === "OVER_BUDGET";

                            return (
                              <div className="budget-single-card" key={alert.budget_id}>
                                <div className="budget-card-header">
                                  <div>
                                    <div className="budget-category-title">
                                      <span className="category-icon" style={{ fontSize: "16px", marginRight: "6px" }}>
                                        {getCategoryIcon(alert.category)}
                                      </span>
                                      <strong>{alert.category}</strong>
                                    </div>
                                    <div className="budget-period-tag">
                                      {periodLabel ? periodLabel.toUpperCase() : "BUDGET"}
                                      {dateRangeLabel ? ` • ${dateRangeLabel}` : ""}
                                    </div>
                                  </div>

                                  <span className={`budget-status-badge ${statusInfo.badgeClass}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>

                                <div className="budget-figures-row">
                                  <span className="budget-spent-text">
                                    Spent: <strong>{formatCurrency(alert.spent)}</strong>
                                  </span>
                                  <span className="budget-limit-text">
                                    Limit: {formatCurrency(alert.budget_limit)}
                                  </span>
                                </div>

                                <div className="budget-bar-track">
                                  <div
                                    className={`budget-bar-fill ${statusInfo.barClass}`}
                                    style={{ width: `${clampedProgress}%` }}
                                  />
                                </div>

                                <div className="budget-footer-row">
                                  <span className="budget-util-pct">
                                    {Number(alert.utilization_percentage).toFixed(1)}% used
                                  </span>
                                  <span className={`budget-remaining-text ${isOver ? "text-danger" : "text-success"}`}>
                                    {isOver
                                      ? `${formatCurrency(Math.abs(Number(alert.remaining)))} over budget`
                                      : `${formatCurrency(alert.remaining)} remaining`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Configured Budgets Detail Section */}
                    <div className="notion-card-panel">
                      <div className="section-header">
                        <div>
                          <h2>Configured Budgets</h2>
                          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                            Manage thresholds and timeline boundaries for each expense category
                          </p>
                        </div>
                        <button
                          className="notion-btn-primary"
                          onClick={() => setShowBudgetForm(true)}
                          type="button"
                        >
                          + Add Budget
                        </button>
                      </div>

                      {budgetSummary.length === 0 ? (
                        <p style={{ color: "#9ca3af" }}>No budgets configured yet.</p>
                      ) : (
                        <div className="budgets-grid">
                          {budgetSummary.map((budget) => (
                            <div className="budget-card" key={budget.budget_id}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3>{getCategoryIcon(budget.category)} {budget.category}</h3>
                                <span className="notion-tag" style={{ background: "#252525", color: "#9ca3af" }}>
                                  {budget.period || "MONTHLY"}
                                </span>
                              </div>
                              <p className="budget-amount">
                                {formatCurrency(budget.budget_limit)}
                              </p>
                              <p><strong>Spent:</strong> {formatCurrency(budget.spent)}</p>
                              <p><strong>Remaining:</strong> {formatCurrency(budget.remaining)}</p>
                              <p><strong>Used:</strong> {Number(budget.utilization_percentage || 0).toFixed(1)}%</p>
                              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                                {budget.start_date} → {budget.end_date}
                              </p>
                              <div className="budget-progress">
                                <div
                                  className="budget-progress-bar"
                                  style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 6. DEDICATED ALLOCATIONS VIEW (overviewSubView === "allocations") */}
                {overviewSubView === "allocations" && (
                  <div className="notion-card-panel">
                    <div className="section-header">
                      <div>
                        <h2>Income Allocations & Commitments</h2>
                        <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                          Plan upcoming financial liabilities and track actual disbursement
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="notion-pill-action"
                          onClick={() => setOverviewSubView("all")}
                          type="button"
                        >
                          ★ Overview
                        </button>
                        <button
                          className="notion-btn-primary"
                          onClick={() => setShowAllocationForm(!showAllocationForm)}
                          type="button"
                        >
                          {showAllocationForm ? "Cancel" : "+ Add Allocation"}
                        </button>
                      </div>
                    </div>

                    {showAllocationForm && (
                      <div className="transaction-form" style={{ marginBottom: "20px" }}>
                        <form onSubmit={handleAddAllocation}>
                          <input
                            type="text"
                            placeholder="Title (e.g. Rent, Tuition)"
                            value={allocationForm.title}
                            onChange={(e) => setAllocationForm({ ...allocationForm, title: e.target.value })}
                            required
                          />
                          <input
                            type="text"
                            placeholder="Category (e.g. Housing)"
                            value={allocationForm.category}
                            onChange={(e) => setAllocationForm({ ...allocationForm, category: e.target.value })}
                          />
                          <input
                            type="number"
                            placeholder="Planned Amount (₹)"
                            min="0.01"
                            step="0.01"
                            value={allocationForm.planned_amount}
                            onChange={(e) => setAllocationForm({ ...allocationForm, planned_amount: e.target.value })}
                            required
                          />
                          <input
                            type="date"
                            value={allocationForm.due_date}
                            onChange={(e) => setAllocationForm({ ...allocationForm, due_date: e.target.value })}
                          />
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={allocationForm.description}
                            onChange={(e) => setAllocationForm({ ...allocationForm, description: e.target.value })}
                          />
                          <button type="submit" className="notion-btn-primary">Save Allocation</button>
                        </form>
                      </div>
                    )}

                    <div className="budgets-grid">
                      {allocations.length === 0 ? (
                        <p style={{ color: "#9ca3af" }}>No planned allocations found.</p>
                      ) : (
                        allocations.map((allocation) => (
                          <div className="budget-card" key={allocation.allocation_id}>
                            <h3>{allocation.title}</h3>
                            <p><strong>Category:</strong> {allocation.category || "Uncategorized"}</p>
                            <p><strong>Planned:</strong> {formatCurrency(allocation.planned_amount)}</p>
                            <p><strong>Actual:</strong> {formatCurrency(allocation.actual_amount)}</p>
                            <p>
                              <strong>Remaining:</strong> {formatCurrency(Number(allocation.planned_amount) - Number(allocation.actual_amount))}
                            </p>
                            <p><strong>Due Date:</strong> {allocation.due_date || "Not set"}</p>
                            <p><strong>Status:</strong> {allocation.status}</p>
                            {allocation.description && <p style={{ fontSize: "12px" }}>{allocation.description}</p>}
                            <button
                              className="budget-button"
                              style={{ marginTop: "10px" }}
                              onClick={() => setEditingAllocation(allocation)}
                              type="button"
                            >
                              Update Allocation
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 7. DEDICATED SPLIT BILLS VIEW (overviewSubView === "splits") */}
                {overviewSubView === "splits" && (
                  <div className="notion-card-panel">
                    <div className="section-header">
                      <div>
                        <h2>Split Bills & Shared Settlements</h2>
                        <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                          Group liability tracking with internal and external participant balances
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="notion-pill-action"
                          onClick={() => setOverviewSubView("all")}
                          type="button"
                        >
                          ★ Overview
                        </button>
                        <button
                          className="notion-btn-primary"
                          onClick={() => setShowSplitBillForm(!showSplitBillForm)}
                          type="button"
                        >
                          {showSplitBillForm ? "Cancel" : "+ Add Split Bill"}
                        </button>
                      </div>
                    </div>

                    {showSplitBillForm && (
                      <form className="transaction-form" onSubmit={handleAddSplitBill} style={{ marginBottom: "20px" }}>
                        <input
                          type="text"
                          placeholder="Bill title (e.g. Weekend Trip)"
                          value={splitBillForm.title}
                          onChange={(e) => setSplitBillForm({ ...splitBillForm, title: e.target.value })}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Total amount (₹)"
                          min="0.01"
                          step="0.01"
                          value={splitBillForm.total_amount}
                          onChange={(e) => setSplitBillForm({ ...splitBillForm, total_amount: e.target.value })}
                          required
                        />
                        <input
                          type="date"
                          value={splitBillForm.bill_date}
                          onChange={(e) => setSplitBillForm({ ...splitBillForm, bill_date: e.target.value })}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={splitBillForm.description}
                          onChange={(e) => setSplitBillForm({ ...splitBillForm, description: e.target.value })}
                        />

                        <h3 style={{ gridColumn: "1 / -1", marginTop: "10px", color: "#e5e7eb" }}>Participants</h3>

                        {splitBillForm.participants.map((person, index) => (
                          <div key={index} className="form-row" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
                            <input
                              type="text"
                              placeholder={`Person ${index + 1} name`}
                              value={person.name}
                              onChange={(e) => {
                                const participants = [...splitBillForm.participants];
                                participants[index] = { ...participants[index], name: e.target.value };
                                setSplitBillForm({ ...splitBillForm, participants });
                              }}
                              required
                            />
                            <select
                              value={person.user_id ?? ""}
                              onChange={(e) => {
                                const participants = [...splitBillForm.participants];
                                const selectedUser = registeredUsers.find((user) => String(user.user_id) === e.target.value);
                                participants[index] = {
                                  ...participants[index],
                                  user_id: e.target.value ? Number(e.target.value) : null,
                                  name: selectedUser ? selectedUser.name : participants[index].name,
                                };
                                setSplitBillForm({ ...splitBillForm, participants });
                              }}
                            >
                              <option value="">External participant</option>
                              {registeredUsers.map((user) => (
                                <option key={user.user_id} value={user.user_id}>
                                  {user.name} (ID: {user.user_id})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Share (₹)"
                              min="0.01"
                              step="0.01"
                              value={person.share_amount}
                              onChange={(e) => {
                                const participants = [...splitBillForm.participants];
                                participants[index] = { ...participants[index], share_amount: e.target.value };
                                setSplitBillForm({ ...splitBillForm, participants });
                              }}
                              required
                            />
                            <button
                              type="button"
                              className="budget-button"
                              onClick={() => {
                                const participants = splitBillForm.participants.filter((_, i) => i !== index);
                                setSplitBillForm({ ...splitBillForm, participants });
                              }}
                              disabled={splitBillForm.participants.length <= 1}
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
                          <button
                            type="button"
                            className="budget-button"
                            onClick={() =>
                              setSplitBillForm({
                                ...splitBillForm,
                                participants: [...splitBillForm.participants, { name: "", share_amount: "" }],
                              })
                            }
                          >
                            + Add Participant
                          </button>
                          <button type="submit" className="notion-btn-primary">Save Split Bill</button>
                          <button type="button" onClick={() => setShowSplitBillForm(false)} className="budget-button">Cancel</button>
                        </div>
                      </form>
                    )}

                    <div className="budgets-grid">
                      {splitBills.length === 0 ? (
                        <p style={{ color: "#9ca3af" }}>No split bills recorded.</p>
                      ) : (
                        splitBills.map((bill) => (
                          <div className="budget-card" key={bill.split_bill_id}>
                            <h3>{bill.title}</h3>
                            <p><strong>Total:</strong> {formatCurrency(bill.total_amount)}</p>
                            <p><strong>Date:</strong> {bill.bill_date}</p>
                            {bill.description && <p style={{ fontSize: "12px" }}>{bill.description}</p>}

                            <h4 style={{ marginTop: "12px", borderTop: "1px solid #374151", paddingTop: "8px" }}>Participants</h4>
                            {bill.participants.map((person) => {
                              const outstanding = Math.max(0, Number(person.share_amount) - Number(person.amount_paid || 0));
                              return (
                                <div key={person.participant_id} style={{ margin: "8px 0", fontSize: "13px" }}>
                                  <p><strong>{person.name}</strong>: Share {formatCurrency(person.share_amount)} | Paid {formatCurrency(person.amount_paid || 0)}</p>
                                  <p style={{ color: outstanding > 0 ? "#f87171" : "#4ade80" }}>
                                    Outstanding: {formatCurrency(outstanding)} ({person.status})
                                  </p>
                                  {outstanding > 0 && (
                                    <button
                                      className="budget-button"
                                      style={{ marginTop: "4px", fontSize: "11px", padding: "4px 8px" }}
                                      onClick={() => setSettlementTarget({ bill, participant: person })}
                                      type="button"
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
                )}
              </>
            )}
          </main>
        </div>

        {/* IN-APP CONFIRMATION MODAL: DELETE TRANSACTION */}
        <ConfirmDialog
          isOpen={!!deleteTransactionTarget}
          title={`Delete ${deleteTransactionTarget?.type === "INCOME" ? "Income" : "Expense"} Record`}
          message={
            deleteTransactionTarget ? (
              <p>
                Are you sure you want to delete this{" "}
                <strong>{deleteTransactionTarget.type.toLowerCase()}</strong> record of{" "}
                <strong>{formatCurrency(deleteTransactionTarget.amount)}</strong>
                {deleteTransactionTarget.category
                  ? ` (${deleteTransactionTarget.category})`
                  : deleteTransactionTarget.source
                  ? ` (${deleteTransactionTarget.source})`
                  : ""}{" "}
                dated <strong>{deleteTransactionTarget.date}</strong>? This action cannot be undone.
              </p>
            ) : ""
          }
          confirmText="Delete Record"
          cancelText="Cancel"
          onConfirm={handleConfirmDeleteTransaction}
          onCancel={() => {
            if (!isDeletingTransaction) setDeleteTransactionTarget(null);
          }}
          isLoading={isDeletingTransaction}
          variant="danger"
        />

        {/* IN-APP FORM MODAL: UPDATE INCOME ALLOCATION */}
        <UpdateAllocationModal
          isOpen={!!editingAllocation}
          allocation={editingAllocation}
          onClose={() => setEditingAllocation(null)}
          onSuccess={async (successMsg) => {
            addToast(successMsg, "success");
            const token = localStorage.getItem("access_token");
            if (token) await fetchAllocations(token);
          }}
          apiUrl={API_URL}
          token={localStorage.getItem("access_token")}
        />

        {/* IN-APP FORM MODAL: RECORD SPLIT BILL SETTLEMENT */}
        <RecordSettlementModal
          isOpen={!!settlementTarget}
          bill={settlementTarget?.bill}
          participant={settlementTarget?.participant}
          onClose={() => setSettlementTarget(null)}
          onSuccess={async (successMsg) => {
            addToast(successMsg, "success");
            const token = localStorage.getItem("access_token");
            if (token) await fetchSplitBills(token);
          }}
          apiUrl={API_URL}
          token={localStorage.getItem("access_token")}
        />

        {/* MODALS FOR QUICK ACTIONS */}
        <Modal
          isOpen={showIncomeForm}
          onClose={() => setShowIncomeForm(false)}
          title="Add New Income"
          maxWidth="480px"
        >
          <form onSubmit={(e) => handleAddTransaction(e, "income")}>
            <label>Amount (₹)</label>
            <input type="number" name="amount" placeholder="0.00" min="0" step="0.01" required />

            <label>Source</label>
            <input type="text" name="source" placeholder="Salary, Freelance, Dividend..." required />

            <label>Date</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} />

            <label>Description</label>
            <input type="text" name="description" placeholder="Optional notes" />

            <div className="notion-modal-actions">
              <button type="submit" className="notion-btn-income">Add Income</button>
              <button type="button" onClick={() => setShowIncomeForm(false)} className="notion-btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showExpenseForm}
          onClose={() => setShowExpenseForm(false)}
          title="Add New Expense"
          maxWidth="480px"
        >
          <form onSubmit={(e) => handleAddTransaction(e, "expense")}>
            <label>Amount (₹)</label>
            <input type="number" name="amount" placeholder="0.00" min="0" step="0.01" required />

            <label>Category</label>
            <input type="text" name="category" placeholder="Food, Travel, Utilities, Shopping..." required />

            <label>Merchant</label>
            <input type="text" name="merchant" placeholder="Store or vendor name" />

            <label>Date</label>
            <input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} />

            <label>Payment Method</label>
            <select name="payment_method">
              <option value="">Select method</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>

            <label>Description</label>
            <input type="text" name="description" placeholder="Optional notes" />

            <div className="notion-modal-actions">
              <button type="submit" className="notion-btn-expense">Add Expense</button>
              <button type="button" onClick={() => setShowExpenseForm(false)} className="notion-btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showBudgetForm}
          onClose={() => setShowBudgetForm(false)}
          title="Add Budget Limit"
          maxWidth="480px"
        >
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
                if (!response.ok) throw new Error(data.detail || "Failed to add budget");

                await fetchBudgets(token);
                await fetchBudgetSummary(token);
                await fetchBudgetAlerts(token);
                setShowBudgetForm(false);
                addToast("Budget added successfully!", "success");
              } catch (error) {
                addToast(error.message, "error");
              }
            }}
          >
            <label>Category</label>
            <input type="text" name="category" placeholder="Food, Utilities, Travel..." required />

            <label>Limit Amount (₹)</label>
            <input type="number" name="limit_amount" placeholder="5000" min="0" step="0.01" required />

            <label>Period</label>
            <select name="period" required>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="YEARLY">Yearly</option>
            </select>

            <label>Start Date</label>
            <input type="date" name="start_date" required defaultValue={new Date().toISOString().split("T")[0]} />

            <label>End Date</label>
            <input type="date" name="end_date" required />

            <div className="notion-modal-actions">
              <button type="submit" className="notion-btn-primary">Add Budget</button>
              <button type="button" onClick={() => setShowBudgetForm(false)} className="notion-btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="login-container">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="login-card">

        <h1>FinTrack</h1>

        <p className="subtitle">
          Personal Finance Management System
        </p>

        <div className="auth-toggle-row">
          <button
            type="button"
            className={`auth-toggle-btn ${!isRegistering ? "active" : ""}`}
            onClick={() => {
              setIsRegistering(false);
              setMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-toggle-btn ${isRegistering ? "active" : ""}`}
            onClick={() => {
              setIsRegistering(true);
              setMessage("");
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>

          {isRegistering && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </>
          )}

          <label>Email Address</label>
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
            placeholder={isRegistering ? "Create password (min 6 chars)" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? (isRegistering ? "Creating Account..." : "Signing In...")
              : (isRegistering ? "Register Account" : "Sign In")}
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