import { useEffect, useState } from "react";
import IncomeForm from "./IncomeForm";
import {
  getIncome,
  addIncome,
  updateIncome,
  deleteIncome,
  deleteAllIncome,
} from "../api/incomeApi";
import { formatCurrency } from "../utils/helpers";
import { useToast } from "./Toast";

export default function IncomePage() {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getIncome();
      setIncome(data || []);
    } catch (err) {
      toast.error("Failed to load income: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data) => {
    try {
      const created = await addIncome(data);
      setIncome((prev) => [created, ...prev]);
      toast.success("Income added!");
    } catch (err) {
      toast.error("Failed to add income: " + err.message);
    }
  };

  const handleUpdate = async (data) => {
    try {
      const updated = await updateIncome(editingEntry.id, data);
      setIncome((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? updated : e)),
      );
      setEditingEntry(null);
      toast.success("Income updated!");
    } catch (err) {
      toast.error("Failed to update: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this income entry?")) return;
    try {
      await deleteIncome(id);
      setIncome((prev) => prev.filter((e) => e.id !== id));
      if (editingEntry?.id === id) setEditingEntry(null);
      toast.success("Income deleted");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL income entries? This cannot be undone."))
      return;
    try {
      await deleteAllIncome();
      setIncome([]);
      toast.success("All income cleared");
    } catch (err) {
      toast.error("Failed to clear: " + err.message);
    }
  };

  const totalIncome = income.reduce((s, e) => s + Number(e.amount), 0);

  // ── Income by source ─────────────────────────────────────
  const sourceTotals = {};
  income.forEach((e) => {
    sourceTotals[e.source] = (sourceTotals[e.source] || 0) + Number(e.amount);
  });

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading income…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Income</h1>
        <p className="muted">Track and manage your income sources</p>
      </div>

      {/* ── Add Income Form ──────────────────────────────── */}
      <section className="panel">
        <h3>Add Income</h3>
        <IncomeForm onAdd={handleAdd} />
      </section>

      {/* ── Quick Stats ──────────────────────────────────── */}
      <div className="dashboard-grid two-col">
        <div className="stat-card stat-income">
          <span className="stat-emoji">💰</span>
          <div className="stat-info">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">{formatCurrency(totalIncome)}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-emoji">📊</span>
          <div className="stat-info">
            <span className="stat-label">Entries</span>
            <span className="stat-value">{income.length}</span>
          </div>
        </div>
      </div>

      {/* ── Income Entries Table ──────────────────────────── */}
      <section className="panel">
        <div className="panel-header">
          <h3>Income Entries</h3>
          {income.length > 0 && (
            <button
              className="danger-btn"
              type="button"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
        </div>
        {income.length === 0 ? (
          <p className="empty-state">
            No income entries yet. Add one above to get started.
          </p>
        ) : (
          <div className="data-table">
            <div className="data-row data-head five-col">
              <span>Date</span>
              <span>Source</span>
              <span className="align-right">Amount</span>
              <span>Note</span>
              <span className="align-right">Actions</span>
            </div>
            {income.map((entry) => (
              <div className="data-row five-col" key={entry.id}>
                <span>{entry.income_date}</span>
                <span>{entry.source}</span>
                <span className="align-right amount-positive">
                  {formatCurrency(entry.amount)}
                </span>
                <span>{entry.note || "—"}</span>
                <span className="align-right">
                  <button
                    className="ghost-btn action-btn"
                    type="button"
                    onClick={() => setEditingEntry(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-btn action-btn"
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Income by Source ──────────────────────────────── */}
      <section className="panel summary">
        <h3>Income by Source</h3>
        <div className="summary-grid">
          {Object.keys(sourceTotals).length === 0 ? (
            <p className="empty-state">Add income to see sources.</p>
          ) : (
            Object.entries(sourceTotals).map(([source, amt]) => (
              <div className="summary-card" key={source}>
                <span>{source}</span>
                <strong>{formatCurrency(amt)}</strong>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Edit Modal ───────────────────────────────────── */}
      {editingEntry && (
        <div className="modal-overlay" onClick={() => setEditingEntry(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Income</h3>
              <button
                className="modal-close"
                onClick={() => setEditingEntry(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <IncomeForm
                key={editingEntry.id}
                onAdd={handleUpdate}
                initialValues={editingEntry}
                submitLabel="Update Income"
                onCancel={() => setEditingEntry(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
