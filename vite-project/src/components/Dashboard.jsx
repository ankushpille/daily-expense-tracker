import { useCallback, useEffect, useMemo, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import IncomeForm from "./IncomeForm";
import { getExpenses, addExpense, updateExpense, deleteExpense, deleteAllExpenses } from "../api/expenseApi";
import { getIncome, addIncome, deleteIncome, deleteAllIncome } from "../api/incomeApi";

const todayString = () => new Date().toISOString().split("T")[0];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const monthLabel = (monthKey) => {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
};

export default function Dashboard({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyReportDate, setDailyReportDate] = useState(todayString());
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [expenseBeingEdited, setExpenseBeingEdited] = useState(null);
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    paymentMode: "",
    fromDate: "",
    toDate: "",
    sortBy: "dateDesc",
  });

  // ── Data fetching ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expData, incData] = await Promise.all([
        getExpenses(),
        getIncome(),
      ]);
      setExpenses(expData || []);
      setIncome(incData || []);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Constants for filters ──────────────────────────────────────

  const CATEGORIES = [
    "Food", "Travel", "Rent", "Shopping", "Bills",
    "Subscriptions", "Health", "Groceries", "Others",
  ];
  const PAYMENT_MODES = [
    "Cash", "Debit Card", "Credit Card", "UPI",
    "Bank Transfer", "Wallet", "Other",
  ];

  // ── Filtered + sorted expenses ─────────────────────────────────

  const filteredExpenses = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return expenses
      .filter((e) => {
        if (filters.category && e.category !== filters.category) return false;
        if (filters.paymentMode && e.payment_mode !== filters.paymentMode) return false;
        if (filters.fromDate && e.expense_date < filters.fromDate) return false;
        if (filters.toDate && e.expense_date > filters.toDate) return false;
        if (!q) return true;
        const hay = `${e.note} ${e.category} ${e.payment_mode}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "dateAsc":
            return a.expense_date.localeCompare(b.expense_date);
          case "amountDesc":
            return b.amount - a.amount;
          case "amountAsc":
            return a.amount - b.amount;
          default:
            return b.expense_date.localeCompare(a.expense_date);
        }
      });
  }, [expenses, filters]);

  // ── Computed values ────────────────────────────────────────────

  const totalAllTime = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses],
  );

  const totalSavingsExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.payment_mode !== "Credit Card")
        .reduce((s, e) => s + Number(e.amount), 0),
    [expenses],
  );

  const totalCreditCardExpenseAllTime = useMemo(
    () =>
      expenses
        .filter((e) => e.payment_mode === "Credit Card")
        .reduce((s, e) => s + Number(e.amount), 0),
    [expenses],
  );

  const totalIncomeAllTime = useMemo(
    () => income.reduce((s, e) => s + Number(e.amount), 0),
    [income],
  );

  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [filteredExpenses],
  );

  const dailyExpenseTotal = useMemo(
    () =>
      expenses
        .filter((e) => e.expense_date === dailyReportDate)
        .reduce((s, e) => s + Number(e.amount), 0),
    [expenses, dailyReportDate],
  );

  // ── Grouped by date ────────────────────────────────────────────

  const groupedExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => {
      const dc = b.expense_date.localeCompare(a.expense_date);
      return dc !== 0 ? dc : b.amount - a.amount;
    });
    const groups = new Map();
    sorted.forEach((e) => {
      if (!groups.has(e.expense_date)) {
        groups.set(e.expense_date, { items: [], total: 0 });
      }
      const g = groups.get(e.expense_date);
      g.items.push(e);
      g.total += Number(e.amount);
    });
    return Array.from(groups, ([date, data]) => ({
      date,
      items: data.items,
      total: data.total,
    }));
  }, [expenses]);

  // ── Category totals ────────────────────────────────────────────

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((totals, e) => {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
      return totals;
    }, {});
  }, [filteredExpenses]);

  const topCategory = useMemo(() => {
    let top = { name: "", amount: 0 };
    Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (amount > top.amount) top = { name, amount };
    });
    return top;
  }, [categoryTotals]);

  // ── Income source totals ───────────────────────────────────────

  const incomeSourceTotals = useMemo(() => {
    return income.reduce((totals, e) => {
      totals[e.source] = (totals[e.source] || 0) + Number(e.amount);
      return totals;
    }, {});
  }, [income]);

  const topIncomeSource = useMemo(() => {
    let top = { name: "", amount: 0 };
    Object.entries(incomeSourceTotals).forEach(([name, amount]) => {
      if (amount > top.amount) top = { name, amount };
    });
    return top;
  }, [incomeSourceTotals]);

  // ── Monthly reports ────────────────────────────────────────────

  const monthlyReports = useMemo(() => {
    const monthSet = new Set();
    expenses.forEach((e) => monthSet.add(e.expense_date.slice(0, 7)));
    income.forEach((e) => monthSet.add(e.income_date.slice(0, 7)));
    const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

    return months.map((mk) => {
      const expInMonth = expenses.filter((e) => e.expense_date.startsWith(mk));
      const incInMonth = income.filter((e) => e.income_date.startsWith(mk));
      const totalExpense = expInMonth.reduce((s, e) => s + Number(e.amount), 0);
      const savingsExpense = expInMonth
        .filter((e) => e.payment_mode !== "Credit Card")
        .reduce((s, e) => s + Number(e.amount), 0);
      const creditCardExpense = expInMonth
        .filter((e) => e.payment_mode === "Credit Card")
        .reduce((s, e) => s + Number(e.amount), 0);
      const totalIncome = incInMonth.reduce((s, e) => s + Number(e.amount), 0);

      const catTotals = expInMonth.reduce((t, e) => {
        t[e.category] = (t[e.category] || 0) + Number(e.amount);
        return t;
      }, {});
      const incTotals = incInMonth.reduce((t, e) => {
        t[e.source] = (t[e.source] || 0) + Number(e.amount);
        return t;
      }, {});

      let topCat = "";
      let topCatAmt = 0;
      Object.entries(catTotals).forEach(([n, a]) => {
        if (a > topCatAmt) { topCat = n; topCatAmt = a; }
      });

      let topSrc = "";
      let topSrcAmt = 0;
      Object.entries(incTotals).forEach(([n, a]) => {
        if (a > topSrcAmt) { topSrc = n; topSrcAmt = a; }
      });

      return {
        monthKey: mk,
        totalExpense,
        totalIncome,
        savings: totalIncome - savingsExpense,
        creditCardExpense,
        topCategory: topCat || "--",
        topCategoryAmount: topCatAmt,
        topSource: topSrc || "--",
        topSourceAmount: topSrcAmt,
      };
    });
  }, [expenses, income]);

  const monthWithHighestSpend = useMemo(() => {
    let top = { monthKey: "", totalExpense: 0 };
    monthlyReports.forEach((r) => {
      if (r.totalExpense > top.totalExpense)
        top = { monthKey: r.monthKey, totalExpense: r.totalExpense };
    });
    return top;
  }, [monthlyReports]);

  // ── Handlers ───────────────────────────────────────────────────

  const handleAddExpense = async (data) => {
    try {
      const created = await addExpense(data);
      setExpenses((prev) => [created, ...prev]);
    } catch (err) {
      alert("Failed to add expense: " + err.message);
    }
  };

  const handleUpdateExpense = async (data) => {
    try {
      const updated = await updateExpense(expenseBeingEdited.id, data);
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseBeingEdited.id ? updated : e)),
      );
      setExpenseBeingEdited(null);
    } catch (err) {
      alert("Failed to update expense: " + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (expenseBeingEdited?.id === id) setExpenseBeingEdited(null);
    } catch (err) {
      alert("Failed to delete expense: " + err.message);
    }
  };

  const handleAddIncome = async (data) => {
    try {
      const created = await addIncome(data);
      setIncome((prev) => [created, ...prev]);
    } catch (err) {
      alert("Failed to add income: " + err.message);
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      await deleteIncome(id);
      setIncome((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert("Failed to delete income: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Remove all expenses? This cannot be undone.")) return;
    try {
      await deleteAllExpenses();
      setExpenses([]);
    } catch (err) {
      alert("Failed to clear expenses: " + err.message);
    }
  };

  const handleClearIncome = async () => {
    if (!window.confirm("Remove all income entries? This cannot be undone."))
      return;
    try {
      await deleteAllIncome();
      setIncome([]);
    } catch (err) {
      alert("Failed to clear income: " + err.message);
    }
  };

  const handleDownloadMonthlyPdf = (report) => {
    const printable = `
      <html>
        <head>
          <title>Monthly Report - ${monthLabel(report.monthKey)}</title>
          <style>
            body { font-family: "Segoe UI", Arial, sans-serif; padding: 24px; color: #2b231c; }
            h1 { margin: 0 0 8px; }
            .muted { color: #6b5446; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(200px, 1fr)); gap: 12px; }
            .card { border: 1px solid #e3d7c9; border-radius: 12px; padding: 12px; }
            .section { margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
            th { text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: #6b5446; }
          </style>
        </head>
        <body>
          <h1>Monthly Report</h1>
          <div class="muted">${monthLabel(report.monthKey)} (${report.monthKey})</div>
          <div class="grid">
            <div class="card"><div>Total Income</div><strong>${formatCurrency(report.totalIncome)}</strong></div>
            <div class="card"><div>Total Expense</div><strong>${formatCurrency(report.totalExpense)}</strong></div>
            <div class="card"><div>Savings</div><strong>${formatCurrency(report.savings)}</strong></div>
            <div class="card"><div>Top Category</div><strong>${report.topCategory} (${formatCurrency(report.topCategoryAmount)})</strong></div>
            <div class="card"><div>Top Income Source</div><strong>${report.topSource} (${formatCurrency(report.topSourceAmount)})</strong></div>
          </div>
          <div class="section">
            <h2>Expenses</h2>
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Payment</th><th>Amount</th><th>Note</th></tr></thead>
              <tbody>
                ${expenses
                  .filter((e) => e.expense_date.startsWith(report.monthKey))
                  .map(
                    (e) => `
                  <tr>
                    <td>${e.expense_date}</td>
                    <td>${e.category}</td>
                    <td>${e.payment_mode}</td>
                    <td>${formatCurrency(e.amount)}</td>
                    <td>${e.note || "--"}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Income</h2>
            <table>
              <thead><tr><th>Date</th><th>Source</th><th>Amount</th><th>Note</th></tr></thead>
              <tbody>
                ${income
                  .filter((e) => e.income_date.startsWith(report.monthKey))
                  .map(
                    (e) => `
                  <tr>
                    <td>${e.income_date}</td>
                    <td>${e.source}</td>
                    <td>${formatCurrency(e.amount)}</td>
                    <td>${e.note || "--"}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>`;

    const reportWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!reportWindow) {
      window.alert("Popup blocked. Please allow popups to download the PDF.");
      return;
    }
    reportWindow.document.write(printable);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDateGroup = (date) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading your data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="panel">
          <p className="form-error">{error}</p>
          <button className="primary-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="top-bar">
        <div className="top-bar-user">
          <span className="user-avatar">
            {(user.email || "U")[0].toUpperCase()}
          </span>
          <span className="user-email">{user.email}</span>
        </div>
        <button id="logout-btn" className="ghost-btn" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <header className="hero">
        <div>
          <p className="eyebrow">Daily Expense Tracker</p>
          <h1>Track every rupee, see the story.</h1>
          <p className="subtitle">
            Log expenses, filter by day, and spot where money really goes.
          </p>
        </div>
        <div className="hero-card">
          <p>Total spent (filtered)</p>
          <h2>{formatCurrency(totalFiltered)}</h2>
          <span>All time expense: {formatCurrency(totalAllTime)}</span>
          <span>
            Credit card used: {formatCurrency(totalCreditCardExpenseAllTime)}
          </span>
          <span>Total income: {formatCurrency(totalIncomeAllTime)}</span>
          <span>
            Remaining income:{" "}
            {formatCurrency(totalIncomeAllTime - totalSavingsExpenses)}
          </span>
        </div>
      </header>

      {/* ── Add Expense ─────────────────────────────────────── */}
      <section className="panel">
        <h3>{expenseBeingEdited ? "Edit expense" : "Add a new expense"}</h3>
        <ExpenseForm
          key={expenseBeingEdited?.id || "new-expense"}
          onAdd={expenseBeingEdited ? handleUpdateExpense : handleAddExpense}
          initialValues={expenseBeingEdited}
          submitLabel={expenseBeingEdited ? "Update expense" : "Add expense"}
          onCancel={
            expenseBeingEdited
              ? () => setExpenseBeingEdited(null)
              : undefined
          }
        />
      </section>

      {/* ── Add Income ──────────────────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Add income</h3>
          <button
            className="ghost-btn"
            type="button"
            onClick={handleClearIncome}
          >
            Clear income
          </button>
        </div>
        <IncomeForm onAdd={handleAddIncome} />
      </section>

      {/* ── Daily Total ─────────────────────────────────────── */}
      <section className="panel">
        <h3>Daily total</h3>
        <div className="filters">
          <label className="field">
            <span>Pick a date</span>
            <input
              type="date"
              value={dailyReportDate}
              onChange={(e) => setDailyReportDate(e.target.value)}
            />
          </label>
          <div className="summary-card">
            <span>Expenses on {dailyReportDate}</span>
            <strong>{formatCurrency(dailyExpenseTotal)}</strong>
          </div>
        </div>
      </section>

      {/* ── Filter & Sort ───────────────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Filter &amp; sort</h3>
          <button className="ghost-btn" type="button" onClick={handleClearAll}>
            Clear all data
          </button>
        </div>
        <div className="filters">
          <label className="field">
            <span>Search</span>
            <input
              type="search"
              placeholder="Category, payment, note"
              value={filters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select
              value={filters.category}
              onChange={(e) => updateFilter("category", e.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Payment mode</span>
            <select
              value={filters.paymentMode}
              onChange={(e) => updateFilter("paymentMode", e.target.value)}
            >
              <option value="">All payment modes</option>
              {PAYMENT_MODES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => updateFilter("fromDate", e.target.value)}
            />
          </label>
          <label className="field">
            <span>To</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => updateFilter("toDate", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Sort by</span>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
            >
              <option value="dateDesc">Newest first</option>
              <option value="dateAsc">Oldest first</option>
              <option value="amountDesc">Amount: high to low</option>
              <option value="amountAsc">Amount: low to high</option>
            </select>
          </label>
        </div>
      </section>

      {/* ── Recent Expenses ─────────────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Recent expenses</h3>
          <span className="muted">{expenses.length} items</span>
        </div>
        {expenses.length === 0 ? (
          <p className="empty-state">
            No expenses yet. Add one above to get started.
          </p>
        ) : (
          <div className="date-groups">
            {groupedExpenses.map((group) => (
              <div className="date-group" key={group.date}>
                <div className="date-group-header">
                  <div>
                    <p className="muted date-group-title">
                      Date: {group.date}
                    </p>
                    <p className="date-group-total">
                      Total: {formatCurrency(group.total)}
                    </p>
                  </div>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => toggleDateGroup(group.date)}
                  >
                    {expandedDates.has(group.date)
                      ? "Hide details"
                      : "View details"}
                  </button>
                </div>
                {expandedDates.has(group.date) ? (
                  <div className="expense-table date-expense-table">
                    <div className="expense-row date-expense-row expense-head">
                      <span>Category</span>
                      <span>Payment</span>
                      <span className="align-right">Amount</span>
                      <span>Note</span>
                      <span className="align-right">Action</span>
                    </div>
                    {group.items.map((expense) => (
                      <div
                        className="expense-row date-expense-row"
                        key={expense.id}
                      >
                        <span>{expense.category}</span>
                        <span>{expense.payment_mode}</span>
                        <span className="align-right">
                          {formatCurrency(expense.amount)}
                        </span>
                        <span>{expense.note || "--"}</span>
                        <span className="align-right">
                          <button
                            className="ghost-btn action-btn"
                            type="button"
                            onClick={() => setExpenseBeingEdited(expense)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-btn action-btn"
                            type="button"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            Delete
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Income Entries ──────────────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Income entries</h3>
          <span className="muted">{income.length} items</span>
        </div>
        {income.length === 0 ? (
          <p className="empty-state">Add income to see sources and savings.</p>
        ) : (
          <div className="expense-table">
            <div className="expense-row expense-head">
              <span>Date</span>
              <span>Source</span>
              <span className="align-right">Amount</span>
              <span>Note</span>
              <span className="align-right">Action</span>
            </div>
            {income.map((entry) => (
              <div className="expense-row" key={entry.id}>
                <span>{entry.income_date}</span>
                <span>{entry.source}</span>
                <span className="align-right">
                  {formatCurrency(entry.amount)}
                </span>
                <span>{entry.note || "--"}</span>
                <span className="align-right">
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleDeleteIncome(entry.id)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Category Breakdown ──────────────────────────────── */}
      <section className="panel summary">
        <h3>Category breakdown</h3>
        <div className="summary-grid">
          {Object.keys(categoryTotals).length === 0 ? (
            <p className="empty-state">Add expenses to see totals.</p>
          ) : (
            Object.entries(categoryTotals).map(([cat, amt]) => (
              <div className="summary-card" key={cat}>
                <span>{cat}</span>
                <strong>{formatCurrency(amt)}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Insights ────────────────────────────────────────── */}
      <section className="panel summary">
        <h3>Insights</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Top spending category</span>
            <strong>
              {topCategory.name
                ? `${topCategory.name} (${formatCurrency(topCategory.amount)})`
                : "--"}
            </strong>
          </div>
          <div className="summary-card">
            <span>Top income source</span>
            <strong>
              {topIncomeSource.name
                ? `${topIncomeSource.name} (${formatCurrency(topIncomeSource.amount)})`
                : "--"}
            </strong>
          </div>
          <div className="summary-card">
            <span>Lifetime savings</span>
            <strong>
              {formatCurrency(totalIncomeAllTime - totalSavingsExpenses)}
            </strong>
          </div>
          <div className="summary-card">
            <span>Highest spend month</span>
            <strong>
              {monthWithHighestSpend.monthKey
                ? `${monthWithHighestSpend.monthKey} (${formatCurrency(monthWithHighestSpend.totalExpense)})`
                : "--"}
            </strong>
          </div>
        </div>
      </section>

      {/* ── Income Sources ──────────────────────────────────── */}
      <section className="panel">
        <h3>Income sources</h3>
        <div className="summary-grid">
          {Object.keys(incomeSourceTotals).length === 0 ? (
            <p className="empty-state">Add income to see sources.</p>
          ) : (
            Object.entries(incomeSourceTotals).map(([source, amt]) => (
              <div className="summary-card" key={source}>
                <span>{source}</span>
                <strong>{formatCurrency(amt)}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Monthly Report ──────────────────────────────────── */}
      <section className="panel">
        <h3>Monthly report</h3>
        {monthlyReports.length === 0 ? (
          <p className="empty-state">
            Add expenses and income to build monthly reports.
          </p>
        ) : (
          <div className="report-table">
            <div className="report-row report-head">
              <span>Month</span>
              <span className="align-right">Income</span>
              <span className="align-right">Expenses</span>
              <span className="align-right">Credit Card</span>
              <span className="align-right">Remaining</span>
              <span>Top expense</span>
              <span>Top income</span>
              <span className="align-right">PDF</span>
            </div>
            {monthlyReports.map((report) => (
              <div className="report-row" key={report.monthKey}>
                <span>
                  {monthLabel(report.monthKey)} ({report.monthKey})
                </span>
                <span className="align-right">
                  {formatCurrency(report.totalIncome)}
                </span>
                <span className="align-right">
                  {formatCurrency(report.totalExpense)}
                </span>
                <span className="align-right">
                  {formatCurrency(report.creditCardExpense)}
                </span>
                <span className="align-right">
                  {formatCurrency(report.savings)}
                </span>
                <span>
                  {report.topCategory === "--"
                    ? "--"
                    : `${report.topCategory} (${formatCurrency(report.topCategoryAmount)})`}
                </span>
                <span>
                  {report.topSource === "--"
                    ? "--"
                    : `${report.topSource} (${formatCurrency(report.topSourceAmount)})`}
                </span>
                <span className="align-right">
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => handleDownloadMonthlyPdf(report)}
                  >
                    Download PDF
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
