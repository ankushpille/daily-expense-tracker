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
import {
  MonthlyTrendChart,
  CategoryPieChart,
  SavingsLineChart,
} from "./DashboardCharts";

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
  const netSavings = totalIncome - totalExpenses;

  const recurringStatus = useMemo(
    () => getRecurringStatus(recurring, income),
    [recurring, income],
  );
  const pendingIncome = recurringStatus.filter((s) => !s.received);
  const totalPendingAmount = pendingIncome.reduce(
    (s, r) => s + Number(r.expected_amount),
    0,
  );

  const { overdue, upcoming } = useMemo(
    () => categorizeReminders(reminders),
    [reminders],
  );

  // ── Aggregated Data for Charts ──────────────────────────────
  const categoryTotals = useMemo(() => {
    const t = {};
    expenses.forEach((e) => {
      t[e.category] = (t[e.category] || 0) + Number(e.amount);
    });
    return t;
  }, [expenses]);

  const monthlyReports = useMemo(() => {
    const monthSet = new Set();
    expenses.forEach((e) => monthSet.add(e.expense_date.slice(0, 7)));
    income.forEach((e) => monthSet.add(e.income_date.slice(0, 7)));
    const months = Array.from(monthSet).sort((a, b) => a.localeCompare(b)); // ASC for trend chart

    return months.map((mk) => {
      const expInMonth = expenses.filter((e) =>
        e.expense_date.startsWith(mk),
      );
      const incInMonth = income.filter((e) => e.income_date.startsWith(mk));
      const totalExp = expInMonth.reduce((s, e) => s + Number(e.amount), 0);
      const totalInc = incInMonth.reduce((s, e) => s + Number(e.amount), 0);
      return {
        monthKey: monthLabel(mk),
        totalExpense: totalExp,
        totalIncome: totalInc,
        savings: totalInc - totalExp,
      };
    });
  }, [expenses, income]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Analyzing your finances...</p>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>Financial Overview</h1>
        <p className="muted">Track, analyze and optimize your spending</p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="dashboard-grid stats-grid">
        <div className="stat-card stat-income premium">
          <div className="stat-card-inner">
            <span className="stat-emoji">💰</span>
            <div className="stat-info">
              <span className="stat-label">Total Income</span>
              <span className="stat-value">{formatCurrency(totalIncome)}</span>
            </div>
          </div>
        </div>
        <div className="stat-card stat-expense premium">
          <div className="stat-card-inner">
            <span className="stat-emoji">💸</span>
            <div className="stat-info">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
        <div className="stat-card stat-savings premium">
          <div className="stat-card-inner">
            <span className="stat-emoji">{netSavings >= 0 ? "📈" : "📉"}</span>
            <div className="stat-info">
              <span className="stat-label">Net Savings</span>
              <span className={`stat-value ${netSavings >= 0 ? "positive" : "negative"}`}>
                {formatCurrency(netSavings)}
              </span>
            </div>
          </div>
        </div>
        <div className="stat-card stat-alerts premium">
          <div className="stat-card-inner">
            <span className="stat-emoji">⚠️</span>
            <div className="stat-info">
              <span className="stat-label">Pending / Dues</span>
              <span className="stat-value">
                {pendingIncome.length + overdue.length + upcoming.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-secondary">
        {/* ── Visual Analytics ─────────────────────────────── */}
        <div className="dashboard-main-content">
          <section className="panel chart-panel">
            <div className="panel-header">
              <h3>Income vs Expenses Trend</h3>
            </div>
            <div className="chart-container">
              <MonthlyTrendChart data={monthlyReports} />
            </div>
          </section>

          <div className="analytics-row">
            <section className="panel chart-panel">
              <div className="panel-header">
                <h3>Expense Distribution</h3>
              </div>
              <div className="chart-container">
                <CategoryPieChart data={categoryTotals} />
              </div>
            </section>
            <section className="panel chart-panel">
              <div className="panel-header">
                <h3>Savings Trend</h3>
              </div>
              <div className="chart-container">
                <SavingsLineChart data={monthlyReports} />
              </div>
            </section>
          </div>

          <section className="panel">
            <h3>Monthly Records</h3>
            {monthlyReports.length === 0 ? (
              <p className="empty-state">No data available for reports.</p>
            ) : (
              <div className="data-table dashboard-table">
                <div className="data-row data-head four-col">
                  <span>Month</span>
                  <span className="align-right">Income</span>
                  <span className="align-right">Expenses</span>
                  <span className="align-right">Savings</span>
                </div>
                {[...monthlyReports].reverse().map((r) => (
                  <div className="data-row four-col" key={r.monthKey}>
                    <span>{r.monthKey}</span>
                    <span className="align-right amount-positive">{formatCurrency(r.totalIncome)}</span>
                    <span className="align-right amount-negative">{formatCurrency(r.totalExpense)}</span>
                    <span className={`align-right ${r.savings >= 0 ? "amount-positive" : "amount-negative"}`}>
                      {formatCurrency(r.savings)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Alerts & Notifications Sidebar ────────────────── */}
        <div className="dashboard-sidebar">
          {/* Pending Income */}
          {pendingIncome.length > 0 && (
            <div className="panel alert-panel caution">
              <div className="alert-header">
                <h3>Pending Income</h3>
                <span className="alert-count">{pendingIncome.length}</span>
              </div>
              <div className="alert-list">
                {pendingIncome.map((src) => (
                  <div key={src.id} className="alert-item">
                    <div className="alert-item-info">
                      <strong>{src.source_name}</strong>
                      <span>{formatCurrency(src.expected_amount)}</span>
                    </div>
                    <span className="badge caution">Due day {src.due_day}</span>
                  </div>
                ))}
              </div>
              <div className="alert-footer">
                <span>Total Expected: {formatCurrency(totalPendingAmount)}</span>
              </div>
            </div>
          )}

          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="panel alert-panel critical">
              <div className="alert-header">
                <h3>Overdue Payments</h3>
                <span className="alert-count">{overdue.length}</span>
              </div>
              <div className="alert-list">
                {overdue.map((r) => (
                  <div key={r.id} className="alert-item">
                    <div className="alert-item-info">
                      <strong>{r.title}</strong>
                      <span>{formatCurrency(r.amount)}</span>
                    </div>
                    <span className="badge critical">{r.due_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="panel alert-panel info">
              <div className="alert-header">
                <h3>Upcoming Dues</h3>
                <span className="alert-count">{upcoming.length}</span>
              </div>
              <div className="alert-list">
                {upcoming.map((r) => (
                  <div key={r.id} className="alert-item">
                    <div className="alert-item-info">
                      <strong>{r.title}</strong>
                      <span>{formatCurrency(r.amount)}</span>
                    </div>
                    <span className="badge info">{r.due_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Placeholder */}
          <section className="panel quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => window.location.hash = "#expenses"}>Add Expense</button>
              <button className="action-btn" onClick={() => window.location.hash = "#income"}>Add Income</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
