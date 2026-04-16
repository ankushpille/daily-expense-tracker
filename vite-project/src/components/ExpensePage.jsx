import { useCallback, useEffect, useMemo, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  deleteAllExpenses,
} from "../api/expenseApi";
import { formatCurrency, todayString, monthLabel } from "../utils/helpers";
import { useToast } from "./Toast";

const CATEGORIES = [
  "Food", "Travel", "Rent", "Shopping", "Bills",
  "Subscriptions", "Health", "Groceries", "Others",
];
const PAYMENT_MODES = [
  "Cash", "Debit Card", "Credit Card", "UPI",
  "Bank Transfer", "Wallet", "Other",
];

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expenseBeingEdited, setExpenseBeingEdited] = useState(null);
  const [dailyReportDate, setDailyReportDate] = useState(todayString());
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [filters, setFilters] = useState({
    query: "", category: "", paymentMode: "",
    fromDate: "", toDate: "", sortBy: "dateDesc",
  });
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data || []);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────
  const handleAddExpense = async (data) => {
    try {
      const created = await addExpense(data);
      setExpenses((prev) => [created, ...prev]);
      toast.success("Expense added!");
    } catch (err) {
      toast.error("Failed to add expense: " + err.message);
    }
  };

  const handleUpdateExpense = async (data) => {
    try {
      const updated = await updateExpense(expenseBeingEdited.id, data);
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseBeingEdited.id ? updated : e)),
      );
      setExpenseBeingEdited(null);
      toast.success("Expense updated!");
    } catch (err) {
      toast.error("Failed to update expense: " + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (expenseBeingEdited?.id === id) setExpenseBeingEdited(null);
      toast.success("Expense deleted");
    } catch (err) {
      toast.error("Failed to delete expense: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Remove all expenses? This cannot be undone.")) return;
    try {
      await deleteAllExpenses();
      setExpenses([]);
      toast.success("All expenses cleared");
    } catch (err) {
      toast.error("Failed to clear expenses: " + err.message);
    }
  };

  const updateFilter = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const toggleDateGroup = (date) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  // ── Computed ────────────────────────────────────────────────
  const totalAllTime = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses],
  );

  const filteredExpenses = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return expenses
      .filter((e) => {
        if (filters.category && e.category !== filters.category) return false;
        if (filters.paymentMode && e.payment_mode !== filters.paymentMode) return false;
        if (filters.fromDate && e.expense_date < filters.fromDate) return false;
        if (filters.toDate && e.expense_date > filters.toDate) return false;
        if (!q) return true;
        return `${e.note} ${e.category} ${e.payment_mode}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "dateAsc": return a.expense_date.localeCompare(b.expense_date);
          case "amountDesc": return b.amount - a.amount;
          case "amountAsc": return a.amount - b.amount;
          default: return b.expense_date.localeCompare(a.expense_date);
        }
      });
  }, [expenses, filters]);

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

  const groupedExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => {
      const dc = b.expense_date.localeCompare(a.expense_date);
      return dc !== 0 ? dc : b.amount - a.amount;
    });
    const groups = new Map();
    sorted.forEach((e) => {
      if (!groups.has(e.expense_date))
        groups.set(e.expense_date, { items: [], total: 0 });
      const g = groups.get(e.expense_date);
      g.items.push(e);
      g.total += Number(e.amount);
    });
    return Array.from(groups, ([date, data]) => ({
      date, items: data.items, total: data.total,
    }));
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((t, e) => {
      t[e.category] = (t[e.category] || 0) + Number(e.amount);
      return t;
    }, {});
  }, [filteredExpenses]);

  if (loading) {
    return (
      <div className="page-loading"><div className="spinner" /><p>Loading expenses…</p></div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        <p className="muted">Track and analyze your spending</p>
      </div>

      {/* ── Add / Edit Expense ───────────────────────────── */}
      <section className="panel">
        <h3>{expenseBeingEdited ? "Edit Expense" : "Add Expense"}</h3>
        <ExpenseForm
          key={expenseBeingEdited?.id || "new"}
          onAdd={expenseBeingEdited ? handleUpdateExpense : handleAddExpense}
          initialValues={expenseBeingEdited}
          submitLabel={expenseBeingEdited ? "Update Expense" : "Add Expense"}
          onCancel={
            expenseBeingEdited ? () => setExpenseBeingEdited(null) : undefined
          }
        />
      </section>

      {/* ── Quick Stats ──────────────────────────────────── */}
      <div className="dashboard-grid two-col">
        <div className="stat-card stat-expense">
          <span className="stat-emoji">💸</span>
          <div className="stat-info">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{formatCurrency(totalAllTime)}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-emoji">🔍</span>
          <div className="stat-info">
            <span className="stat-label">Filtered Total</span>
            <span className="stat-value">{formatCurrency(totalFiltered)}</span>
          </div>
        </div>
      </div>

      {/* ── Daily Total ──────────────────────────────────── */}
      <section className="panel">
        <h3>Daily Total</h3>
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

      {/* ── Filter & Sort ────────────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Filter &amp; Sort</h3>
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
            <select value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Payment mode</span>
            <select value={filters.paymentMode} onChange={(e) => updateFilter("paymentMode", e.target.value)}>
              <option value="">All payment modes</option>
              {PAYMENT_MODES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <label className="field">
            <span>From</span>
            <input type="date" value={filters.fromDate} onChange={(e) => updateFilter("fromDate", e.target.value)} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" value={filters.toDate} onChange={(e) => updateFilter("toDate", e.target.value)} />
          </label>
          <label className="field">
            <span>Sort by</span>
            <select value={filters.sortBy} onChange={(e) => updateFilter("sortBy", e.target.value)}>
              <option value="dateDesc">Newest first</option>
              <option value="dateAsc">Oldest first</option>
              <option value="amountDesc">Amount: high to low</option>
              <option value="amountAsc">Amount: low to high</option>
            </select>
          </label>
        </div>
      </section>

      {/* ── Expenses by Date ─────────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Expenses</h3>
          <span className="muted">{expenses.length} items</span>
        </div>
        {expenses.length === 0 ? (
          <p className="empty-state">No expenses yet. Add one above.</p>
        ) : (
          <div className="date-groups">
            {groupedExpenses.map((group) => (
              <div className="date-group" key={group.date}>
                <div className="date-group-header">
                  <div>
                    <p className="muted date-group-title">Date: {group.date}</p>
                    <p className="date-group-total">
                      Total: {formatCurrency(group.total)}
                    </p>
                  </div>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => toggleDateGroup(group.date)}
                  >
                    {expandedDates.has(group.date) ? "Hide" : "View details"}
                  </button>
                </div>
                {expandedDates.has(group.date) && (
                  <div className="expense-table date-expense-table">
                    <div className="expense-row date-expense-row expense-head">
                      <span>Category</span>
                      <span>Payment</span>
                      <span className="align-right">Amount</span>
                      <span>Note</span>
                      <span className="align-right">Action</span>
                    </div>
                    {group.items.map((expense) => (
                      <div className="expense-row date-expense-row" key={expense.id}>
                        <span>{expense.category}</span>
                        <span>{expense.payment_mode}</span>
                        <span className="align-right">
                          {formatCurrency(expense.amount)}
                        </span>
                        <span>{expense.note || "—"}</span>
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
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Category Breakdown ───────────────────────────── */}
      <section className="panel summary">
        <h3>Category Breakdown</h3>
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
    </div>
  );
}
