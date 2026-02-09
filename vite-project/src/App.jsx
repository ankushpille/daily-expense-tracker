import { useEffect, useMemo, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import "./App.css";

const STORAGE_KEY = "daily-expense-tracker.v1";

const CATEGORIES = [
  "Food",
  "Travel",
  "Rent",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Health",
  "Others",
];

const PAYMENT_MODES = [
  "Cash",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
  "PayPal",
  "Venmo",
  "Other",
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const parseStoredExpenses = () => {
  if (typeof localStorage === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    return [];
  }
};

function App() {
  const [expenses, setExpenses] = useState(() => parseStoredExpenses());
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    paymentMode: "",
    fromDate: "",
    toDate: "",
    sortBy: "dateDesc",
  });

  useEffect(() => {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    return expenses
      .filter((expense) => {
        if (filters.category && expense.category !== filters.category) {
          return false;
        }
        if (filters.paymentMode && expense.paymentMode !== filters.paymentMode) {
          return false;
        }
        if (filters.fromDate && expense.date < filters.fromDate) {
          return false;
        }
        if (filters.toDate && expense.date > filters.toDate) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        const haystack = `${expense.description} ${expense.category} ${expense.paymentMode}`
          .toLowerCase()
          .trim();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "dateAsc":
            return a.date.localeCompare(b.date);
          case "amountDesc":
            return b.amount - a.amount;
          case "amountAsc":
            return a.amount - b.amount;
          default:
            return b.date.localeCompare(a.date);
        }
      });
  }, [expenses, filters]);

  const totalAllTime = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses],
  );

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((totals, expense) => {
      const nextTotals = { ...totals };
      nextTotals[expense.category] =
        (nextTotals[expense.category] || 0) + expense.amount;
      return nextTotals;
    }, {});
  }, [filteredExpenses]);

  const handleAddExpense = (expense) => {
    setExpenses((prev) => [
      { ...expense, id: createId() },
      ...prev,
    ]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const handleClearAll = () => {
    const shouldClear = window.confirm(
      "Remove all expenses? This cannot be undone.",
    );
    if (shouldClear) {
      setExpenses([]);
    }
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Daily Expense Tracker</p>
          <h1>Track every dollar, see the story.</h1>
          <p className="subtitle">
            Log expenses, filter by day, and spot where money really goes.
          </p>
        </div>
        <div className="hero-card">
          <p>Total spent (filtered)</p>
          <h2>{formatCurrency(totalFiltered)}</h2>
          <span>All time: {formatCurrency(totalAllTime)}</span>
        </div>
      </header>

      <section className="panel">
        <h3>Add a new expense</h3>
        <ExpenseForm
          onAdd={handleAddExpense}
          categories={CATEGORIES}
          paymentModes={PAYMENT_MODES}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Filter & sort</h3>
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
              onChange={(event) => updateFilter("query", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Payment mode</span>
            <select
              value={filters.paymentMode}
              onChange={(event) =>
                updateFilter("paymentMode", event.target.value)
              }
            >
              <option value="">All payment modes</option>
              {PAYMENT_MODES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From</span>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) => updateFilter("fromDate", event.target.value)}
            />
          </label>
          <label className="field">
            <span>To</span>
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) => updateFilter("toDate", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Sort by</span>
            <select
              value={filters.sortBy}
              onChange={(event) => updateFilter("sortBy", event.target.value)}
            >
              <option value="dateDesc">Newest first</option>
              <option value="dateAsc">Oldest first</option>
              <option value="amountDesc">Amount: high to low</option>
              <option value="amountAsc">Amount: low to high</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Recent expenses</h3>
          <span className="muted">
            {filteredExpenses.length} items
          </span>
        </div>
        {filteredExpenses.length === 0 ? (
          <p className="empty-state">
            No expenses yet. Add one above to get started.
          </p>
        ) : (
          <div className="expense-table">
            <div className="expense-row expense-head">
              <span>Date</span>
              <span>Category</span>
              <span>Payment</span>
              <span className="align-right">Amount</span>
              <span>Note</span>
              <span className="align-right">Action</span>
            </div>
            {filteredExpenses.map((expense) => (
              <div className="expense-row" key={expense.id}>
                <span>{expense.date}</span>
                <span>{expense.category}</span>
                <span>{expense.paymentMode}</span>
                <span className="align-right">
                  {formatCurrency(expense.amount)}
                </span>
                <span>{expense.description || "—"}</span>
                <span className="align-right">
                  <button
                    className="danger-btn"
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
      </section>

      <section className="panel summary">
        <h3>Category breakdown</h3>
        <div className="summary-grid">
          {Object.keys(categoryTotals).length === 0 ? (
            <p className="empty-state">Add expenses to see totals.</p>
          ) : (
            Object.entries(categoryTotals).map(([category, amount]) => (
              <div className="summary-card" key={category}>
                <span>{category}</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
