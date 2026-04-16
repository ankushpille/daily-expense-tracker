import { useEffect, useMemo, useState } from "react";
import { getIncome } from "../api/incomeApi";
import { getExpenses } from "../api/expenseApi";
import { getRecurringSources } from "../api/recurringIncomeApi";
import { getReminders } from "../api/reminderApi";
import {
  formatCurrency,
  getRecurringStatus,
  categorizeReminders,
  monthLabel,
} from "../utils/helpers";

export default function DashboardPage() {
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inc, exp, rec, rem] = await Promise.all([
          getIncome(),
          getExpenses(),
          getRecurringSources(),
          getReminders(),
        ]);
        setIncome(inc || []);
        setExpenses(exp || []);
        setRecurring(rec || []);
        setReminders(rem || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Computed values ─────────────────────────────────────────
  const totalIncome = useMemo(
    () => income.reduce((s, e) => s + Number(e.amount), 0),
    [income],
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses],
  );

  const recurringStatus = useMemo(
    () => getRecurringStatus(recurring, income),
    [recurring, income],
  );
  const pendingIncome = recurringStatus.filter((s) => !s.received);
  const totalPending = pendingIncome.reduce(
    (s, r) => s + Number(r.expected_amount),
    0,
  );

  const { overdue, upcoming } = useMemo(
    () => categorizeReminders(reminders),
    [reminders],
  );

  // ── Insights ────────────────────────────────────────────────
  const categoryTotals = useMemo(() => {
    const t = {};
    expenses.forEach((e) => {
      t[e.category] = (t[e.category] || 0) + Number(e.amount);
    });
    return t;
  }, [expenses]);

  const topCategory = useMemo(() => {
    let top = { name: "—", amount: 0 };
    Object.entries(categoryTotals).forEach(([n, a]) => {
      if (a > top.amount) top = { name: n, amount: a };
    });
    return top;
  }, [categoryTotals]);

  const incomeSourceTotals = useMemo(() => {
    const t = {};
    income.forEach((e) => {
      t[e.source] = (t[e.source] || 0) + Number(e.amount);
    });
    return t;
  }, [income]);

  const topSource = useMemo(() => {
    let top = { name: "—", amount: 0 };
    Object.entries(incomeSourceTotals).forEach(([n, a]) => {
      if (a > top.amount) top = { name: n, amount: a };
    });
    return top;
  }, [incomeSourceTotals]);

  // ── Monthly reports ─────────────────────────────────────────
  const monthlyReports = useMemo(() => {
    const monthSet = new Set();
    expenses.forEach((e) => monthSet.add(e.expense_date.slice(0, 7)));
    income.forEach((e) => monthSet.add(e.income_date.slice(0, 7)));
    const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

    return months.map((mk) => {
      const expInMonth = expenses.filter((e) =>
        e.expense_date.startsWith(mk),
      );
      const incInMonth = income.filter((e) => e.income_date.startsWith(mk));
      const totalExp = expInMonth.reduce((s, e) => s + Number(e.amount), 0);
      const totalInc = incInMonth.reduce((s, e) => s + Number(e.amount), 0);
      return {
        monthKey: mk,
        totalExpense: totalExp,
        totalIncome: totalInc,
        savings: totalInc - totalExp,
      };
    });
  }, [expenses, income]);

  // ── Render ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">Your financial overview at a glance</p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="dashboard-grid">
        <div className="stat-card stat-income">
          <span className="stat-emoji">💰</span>
          <div className="stat-info">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">{formatCurrency(totalIncome)}</span>
          </div>
        </div>
        <div className="stat-card stat-expense">
          <span className="stat-emoji">💸</span>
          <div className="stat-info">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
        <div className="stat-card stat-pending">
          <span className="stat-emoji">⏳</span>
          <div className="stat-info">
            <span className="stat-label">Pending Income</span>
            <span className="stat-value">
              {pendingIncome.length} source
              {pendingIncome.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="stat-card stat-due">
          <span className="stat-emoji">🔔</span>
          <div className="stat-info">
            <span className="stat-label">Due Alerts</span>
            <span className="stat-value">
              {overdue.length + upcoming.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Net Savings ───────────────────────────────────── */}
      <div className="panel">
        <h3>Net Savings</h3>
        <p
          className={`savings-amount ${totalIncome - totalExpenses >= 0 ? "positive" : "negative"}`}
        >
          {formatCurrency(totalIncome - totalExpenses)}
        </p>
      </div>

      {/* ── Pending Income Alerts ─────────────────────────── */}
      {pendingIncome.length > 0 && (
        <div className="panel alert-panel warning-bg">
          <h3>⚠️ Pending Recurring Income</h3>
          <div className="alert-list">
            {pendingIncome.map((src) => (
              <div key={src.id} className="alert-card warning">
                <div className="alert-card-body">
                  <strong>{src.source_name}</strong>
                  <span>
                    {formatCurrency(src.expected_amount)} pending (due day:{" "}
                    {src.due_day})
                  </span>
                </div>
                <span className="badge badge-warning">Pending</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Total pending: {formatCurrency(totalPending)}
          </p>
        </div>
      )}

      {/* ── Overdue Reminders ─────────────────────────────── */}
      {overdue.length > 0 && (
        <div className="panel alert-panel danger-bg">
          <h3>🚨 Overdue Payments</h3>
          <div className="alert-list">
            {overdue.map((r) => (
              <div key={r.id} className="alert-card danger">
                <div className="alert-card-body">
                  <strong>{r.title}</strong>
                  <span>
                    {formatCurrency(r.amount)} — Due: {r.due_date}
                  </span>
                </div>
                <span className="badge badge-danger">Overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming Reminders ────────────────────────────── */}
      {upcoming.length > 0 && (
        <div className="panel alert-panel upcoming-bg">
          <h3>📅 Upcoming Dues (Next 7 Days)</h3>
          <div className="alert-list">
            {upcoming.map((r) => (
              <div key={r.id} className="alert-card upcoming">
                <div className="alert-card-body">
                  <strong>{r.title}</strong>
                  <span>
                    {formatCurrency(r.amount)} — Due: {r.due_date}
                  </span>
                </div>
                <span className="badge badge-upcoming">Upcoming</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Insights ──────────────────────────────────────── */}
      <section className="panel summary">
        <h3>Insights</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Top spending category</span>
            <strong>
              {topCategory.name !== "—"
                ? `${topCategory.name} (${formatCurrency(topCategory.amount)})`
                : "—"}
            </strong>
          </div>
          <div className="summary-card">
            <span>Top income source</span>
            <strong>
              {topSource.name !== "—"
                ? `${topSource.name} (${formatCurrency(topSource.amount)})`
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      {/* ── Monthly Report ────────────────────────────────── */}
      <section className="panel">
        <h3>Monthly Summary</h3>
        {monthlyReports.length === 0 ? (
          <p className="empty-state">
            Add income and expenses to build monthly reports.
          </p>
        ) : (
          <div className="data-table">
            <div className="data-row data-head four-col">
              <span>Month</span>
              <span className="align-right">Income</span>
              <span className="align-right">Expenses</span>
              <span className="align-right">Savings</span>
            </div>
            {monthlyReports.map((r) => (
              <div className="data-row four-col" key={r.monthKey}>
                <span>{monthLabel(r.monthKey)}</span>
                <span className="align-right amount-positive">
                  {formatCurrency(r.totalIncome)}
                </span>
                <span className="align-right amount-negative">
                  {formatCurrency(r.totalExpense)}
                </span>
                <span
                  className={`align-right ${r.savings >= 0 ? "amount-positive" : "amount-negative"}`}
                >
                  {formatCurrency(r.savings)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Empty state ───────────────────────────────────── */}
      {income.length === 0 &&
        expenses.length === 0 &&
        recurring.length === 0 && (
          <div className="panel" style={{ textAlign: "center" }}>
            <p className="empty-state">
              Welcome! Start by adding income or expenses from the sidebar
              menu.
            </p>
          </div>
        )}
    </div>
  );
}
