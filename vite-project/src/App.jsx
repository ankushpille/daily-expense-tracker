import { useEffect, useMemo, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import IncomeForm from "./IncomeForm";
import "./App.css";

const STORAGE_KEY_EXPENSES = "daily-expense-tracker.expenses.v1";
const STORAGE_KEY_INCOME = "daily-expense-tracker.income.v1";

const CATEGORIES = [
  "Food",
  "Travel",
  "Rent",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Health",
  "Groceries",
  "Others",
];

const PAYMENT_MODES = [
  "Cash",
  "Debit Card",
  "Credit Card",
  "UPI",
  "Bank Transfer",
  "Wallet",
  "Other",
];

const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Refund",
  "Other",
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

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

const parseStoredItems = (storageKey) => {
  if (typeof localStorage === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(storageKey);
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

const buildSampleExpenses = () => {
  const today = todayString();
  return [
    {
      id: createId(),
      date: today,
      category: "Groceries",
      paymentMode: "UPI",
      amount: 420,
      description: "Vegetables & essentials",
    },
    {
      id: createId(),
      date: today,
      category: "Travel",
      paymentMode: "Debit Card",
      amount: 160,
      description: "Metro ride",
    },
    {
      id: createId(),
      date: today,
      category: "Food",
      paymentMode: "Cash",
      amount: 280,
      description: "Lunch",
    },
  ];
};

const getInitialExpenses = () => {
  const stored = parseStoredItems(STORAGE_KEY_EXPENSES);
  if (stored.length > 0) {
    return stored;
  }
  return buildSampleExpenses();
};

function App() {
  const [expenses, setExpenses] = useState(() => getInitialExpenses());
  const [income, setIncome] = useState(() =>
    parseStoredItems(STORAGE_KEY_INCOME),
  );
  const [dailyReportDate, setDailyReportDate] = useState(todayString());
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    paymentMode: "",
    fromDate: "",
    toDate: "",
    sortBy: "dateDesc",
  });
  const [expenseBeingEdited, setExpenseBeingEdited] = useState(null);

  useEffect(() => {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY_INCOME, JSON.stringify(income));
  }, [income]);

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    return expenses
      .filter((expense) => {
        if (filters.category && expense.category !== filters.category) {
          return false;
        }
        if (
          filters.paymentMode &&
          expense.paymentMode !== filters.paymentMode
        ) {
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
        const haystack =
          `${expense.description} ${expense.category} ${expense.paymentMode}`
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

  const totalSavingsExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.paymentMode !== "Credit Card")
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const totalIncomeAllTime = useMemo(
    () => income.reduce((sum, entry) => sum + entry.amount, 0),
    [income],
  );

  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses],
  );

  const dailyExpenseTotal = useMemo(() => {
    return expenses
      .filter((expense) => expense.date === dailyReportDate)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, dailyReportDate]);

  const groupedExpenses = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return b.amount - a.amount;
    });
    const groups = new Map();
    sorted.forEach((expense) => {
      if (!groups.has(expense.date)) {
        groups.set(expense.date, { items: [], total: 0 });
      }
      const group = groups.get(expense.date);
      group.items.push(expense);
      group.total += expense.amount;
    });
    return Array.from(groups, ([date, data]) => ({
      date,
      items: data.items,
      total: data.total,
    }));
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((totals, expense) => {
      const nextTotals = { ...totals };
      nextTotals[expense.category] =
        (nextTotals[expense.category] || 0) + expense.amount;
      return nextTotals;
    }, {});
  }, [filteredExpenses]);

  const topCategory = useMemo(() => {
    let top = { name: "", amount: 0 };
    Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (amount > top.amount) {
        top = { name, amount };
      }
    });
    return top;
  }, [categoryTotals]);

  const incomeSourceTotals = useMemo(() => {
    return income.reduce((totals, entry) => {
      const nextTotals = { ...totals };
      nextTotals[entry.source] = (nextTotals[entry.source] || 0) + entry.amount;
      return nextTotals;
    }, {});
  }, [income]);

  const topIncomeSource = useMemo(() => {
    let top = { name: "", amount: 0 };
    Object.entries(incomeSourceTotals).forEach(([name, amount]) => {
      if (amount > top.amount) {
        top = { name, amount };
      }
    });
    return top;
  }, [incomeSourceTotals]);

  const monthlyReports = useMemo(() => {
    const monthSet = new Set();
    expenses.forEach((expense) => monthSet.add(expense.date.slice(0, 7)));
    income.forEach((entry) => monthSet.add(entry.date.slice(0, 7)));
    const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

    return months.map((monthKey) => {
      const expensesInMonth = expenses.filter((expense) =>
        expense.date.startsWith(monthKey),
      );
      const incomeInMonth = income.filter((entry) =>
        entry.date.startsWith(monthKey),
      );
      const totalExpense = expensesInMonth.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );
      const savingsExpense = expensesInMonth
        .filter((expense) => expense.paymentMode !== "Credit Card")
        .reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = incomeInMonth.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );
      const categoryTotalsInMonth = expensesInMonth.reduce(
        (totals, expense) => {
          const nextTotals = { ...totals };
          nextTotals[expense.category] =
            (nextTotals[expense.category] || 0) + expense.amount;
          return nextTotals;
        },
        {},
      );
      const incomeTotalsInMonth = incomeInMonth.reduce((totals, entry) => {
        const nextTotals = { ...totals };
        nextTotals[entry.source] =
          (nextTotals[entry.source] || 0) + entry.amount;
        return nextTotals;
      }, {});
      let topCategoryInMonth = "";
      let topCategoryAmount = 0;
      Object.entries(categoryTotalsInMonth).forEach(([name, amount]) => {
        if (amount > topCategoryAmount) {
          topCategoryInMonth = name;
          topCategoryAmount = amount;
        }
      });
      let topSourceInMonth = "";
      let topSourceAmount = 0;
      Object.entries(incomeTotalsInMonth).forEach(([name, amount]) => {
        if (amount > topSourceAmount) {
          topSourceInMonth = name;
          topSourceAmount = amount;
        }
      });
      return {
        monthKey,
        totalExpense,
        totalIncome,
        savings: totalIncome - savingsExpense,
        topCategory: topCategoryInMonth || "--",
        topCategoryAmount,
        topSource: topSourceInMonth || "--",
        topSourceAmount,
      };
    });
  }, [expenses, income]);

  const monthWithHighestSpend = useMemo(() => {
    let top = { monthKey: "", totalExpense: 0 };
    monthlyReports.forEach((report) => {
      if (report.totalExpense > top.totalExpense) {
        top = { monthKey: report.monthKey, totalExpense: report.totalExpense };
      }
    });
    return top;
  }, [monthlyReports]);

  const handleAddExpense = (expense) => {
    setExpenses((prev) => [{ ...expense, id: createId() }, ...prev]);
  };

  const handleUpdateExpense = (updatedExpense) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === expenseBeingEdited.id
          ? { ...expense, ...updatedExpense }
          : expense,
      ),
    );
    setExpenseBeingEdited(null);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    if (expenseBeingEdited?.id === id) {
      setExpenseBeingEdited(null);
    }
  };

  const handleAddIncome = (entry) => {
    setIncome((prev) => [{ ...entry, id: createId() }, ...prev]);
  };

  const handleDeleteIncome = (id) => {
    setIncome((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleClearAll = () => {
    const shouldClear = window.confirm(
      "Remove all expenses? This cannot be undone.",
    );
    if (shouldClear) {
      setExpenses([]);
    }
  };

  const handleClearIncome = () => {
    const shouldClear = window.confirm(
      "Remove all income entries? This cannot be undone.",
    );
    if (shouldClear) {
      setIncome([]);
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
            <div class="card">
              <div>Total Income</div>
              <strong>${formatCurrency(report.totalIncome)}</strong>
            </div>
            <div class="card">
              <div>Total Expense</div>
              <strong>${formatCurrency(report.totalExpense)}</strong>
            </div>
            <div class="card">
              <div>Savings</div>
              <strong>${formatCurrency(report.savings)}</strong>
            </div>
            <div class="card">
              <div>Top Category</div>
              <strong>${report.topCategory} (${formatCurrency(
                report.topCategoryAmount,
              )})</strong>
            </div>
            <div class="card">
              <div>Top Income Source</div>
              <strong>${report.topSource} (${formatCurrency(
                report.topSourceAmount,
              )})</strong>
            </div>
          </div>
          <div class="section">
            <h2>Expenses</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                ${expenses
                  .filter((expense) => expense.date.startsWith(report.monthKey))
                  .map(
                    (expense) => `
                  <tr>
                    <td>${expense.date}</td>
                    <td>${expense.category}</td>
                    <td>${expense.paymentMode}</td>
                    <td>${formatCurrency(expense.amount)}</td>
                    <td>${expense.description || "--"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Income</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                ${income
                  .filter((entry) => entry.date.startsWith(report.monthKey))
                  .map(
                    (entry) => `
                  <tr>
                    <td>${entry.date}</td>
                    <td>${entry.source}</td>
                    <td>${formatCurrency(entry.amount)}</td>
                    <td>${entry.note || "--"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

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
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  return (
    <div className="app">
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
          <span>Total income: {formatCurrency(totalIncomeAllTime)}</span>
          <span>
            Remaining income:{" "}
            {formatCurrency(totalIncomeAllTime - totalSavingsExpenses)}
          </span>
        </div>
      </header>

      <section className="panel">
        <h3>{expenseBeingEdited ? "Edit expense" : "Add a new expense"}</h3>
        <ExpenseForm
          key={expenseBeingEdited?.id || "new-expense"}
          onAdd={expenseBeingEdited ? handleUpdateExpense : handleAddExpense}
          categories={CATEGORIES}
          paymentModes={PAYMENT_MODES}
          initialValues={expenseBeingEdited}
          submitLabel={expenseBeingEdited ? "Update expense" : "Add expense"}
          onCancel={
            expenseBeingEdited
              ? () => setExpenseBeingEdited(null)
              : undefined
          }
        />
      </section>

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
        <IncomeForm onAdd={handleAddIncome} incomeSources={INCOME_SOURCES} />
      </section>

      <section className="panel">
        <h3>Daily total</h3>
        <div className="filters">
          <label className="field">
            <span>Pick a date</span>
            <input
              type="date"
              value={dailyReportDate}
              onChange={(event) => setDailyReportDate(event.target.value)}
            />
          </label>
          <div className="summary-card">
            <span>Expenses on {dailyReportDate}</span>
            <strong>{formatCurrency(dailyExpenseTotal)}</strong>
          </div>
        </div>
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
                    {expandedDates.has(group.date) ? "Hide details" : "View details"}
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
                        <span>{expense.paymentMode}</span>
                        <span className="align-right">
                          {formatCurrency(expense.amount)}
                        </span>
                        <span>{expense.description || "--"}</span>
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
                <span>{entry.date}</span>
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
                ? `${topIncomeSource.name} (${formatCurrency(
                    topIncomeSource.amount,
                  )})`
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
                ? `${monthWithHighestSpend.monthKey} (${formatCurrency(
                    monthWithHighestSpend.totalExpense,
                  )})`
                : "--"}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Income sources</h3>
        <div className="summary-grid">
          {Object.keys(incomeSourceTotals).length === 0 ? (
            <p className="empty-state">Add income to see sources.</p>
          ) : (
            Object.entries(incomeSourceTotals).map(([source, amount]) => (
              <div className="summary-card" key={source}>
                <span>{source}</span>
                <strong>{formatCurrency(amount)}</strong>
              </div>
            ))
          )}
        </div>
      </section>

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
                  {formatCurrency(report.savings)}
                </span>
                <span>
                  {report.topCategory === "--"
                    ? "--"
                    : `${report.topCategory} (${formatCurrency(
                        report.topCategoryAmount,
                      )})`}
                </span>
                <span>
                  {report.topSource === "--"
                    ? "--"
                    : `${report.topSource} (${formatCurrency(
                        report.topSourceAmount,
                      )})`}
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

export default App;
