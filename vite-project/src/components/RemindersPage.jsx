import { useEffect, useMemo, useState } from "react";
import {
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
} from "../api/reminderApi";
import { formatCurrency, categorizeReminders } from "../utils/helpers";
import { useToast } from "./Toast";

const DUE_TYPES = ["LIC", "Insurance", "EMI", "Subscription", "Other"];
const RECURRENCE_TYPES = ["one-time", "monthly", "yearly"];
const STATUS_TYPES = ["pending", "paid"];

function ReminderForm({
  onSave,
  initialValues,
  submitLabel = "Add Reminder",
  onCancel,
}) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [dueType, setDueType] = useState(initialValues?.due_type || "LIC");
  const [amount, setAmount] = useState(
    initialValues?.amount ? String(initialValues.amount) : "",
  );
  const [dueDate, setDueDate] = useState(initialValues?.due_date || "");
  const [recurrenceType, setRecurrenceType] = useState(
    initialValues?.recurrence_type || "one-time",
  );
  const [status, setStatus] = useState(initialValues?.status || "pending");
  const [note, setNote] = useState(initialValues?.note || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || !isFinite(amt) || amt <= 0 || !dueDate || !dueType) {
      return;
    }

    onSave({
      title: title.trim(),
      due_type: dueType,
      amount: amt,
      due_date: dueDate,
      recurrence_type: recurrenceType,
      status: status,
      note: note.trim(),
    });

    if (!initialValues) {
      setTitle("");
      setDueType("LIC");
      setAmount("");
      setDueDate("");
      setRecurrenceType("one-time");
      setStatus("pending");
      setNote("");
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            placeholder="e.g. Life Insurance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Type</span>
          <select
            value={dueType}
            onChange={(e) => setDueType(e.target.value)}
            required
          >
            {DUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Amount (₹)</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Due Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Recurrence</span>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
          >
            {RECURRENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field field-full">
        <span>Note (optional)</span>
        <input
          type="text"
          placeholder="Policy number, reference, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="form-actions" style={{ marginTop: "12px" }}>
        <button
          className="primary-btn"
          type="submit"
          disabled={!title || !amount || !dueDate}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button className="ghost-btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getReminders();
      setReminders(data || []);
    } catch (err) {
      toast.error("Failed to load reminders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const { overdue, upcoming, future } = useMemo(
    () => categorizeReminders(reminders),
    [reminders],
  );

  const paidReminders = useMemo(
    () => reminders.filter((r) => r.status === "paid"),
    [reminders]
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleAdd = async (values) => {
    try {
      const created = await addReminder(values);
      setReminders((prev) =>
        [...prev, created].sort((a, b) => a.due_date.localeCompare(b.due_date))
      );
      toast.success("Reminder added successfully!");
    } catch (err) {
      toast.error("Failed to add reminder: " + err.message);
    }
  };

  const handleUpdate = async (values) => {
    try {
      const updated = await updateReminder(editingItem.id, values);
      setReminders((prev) => prev.map((r) => (r.id === editingItem.id ? updated : r)));
      toast.success("Reminder updated successfully!");
      setEditingItem(null);
    } catch (err) {
      toast.error("Failed to update reminder: " + err.message);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === "pending" ? "paid" : "pending";
    try {
      const updated = await updateReminder(item.id, { status: newStatus });
      setReminders((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      toast.success(`Marked as ${newStatus}!`);
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reminder deleted");
    } catch (err) {
      toast.error("Failed to delete reminder: " + err.message);
    }
  };

  // ── Render Card ─────────────────────────────────────────────
  const ReminderCard = ({ item, variant }) => (
    <div className={`reminder-card ${variant}`}>
      <div className="reminder-card-body">
        <div className="reminder-card-info" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "1.1rem" }}>{item.title}</strong>
            <span className="badge" style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#3e3127" }}>
              {item.due_type}
            </span>
            <span className="badge" style={{ backgroundColor: "rgba(0,0,0,0.06)", color: "#3e3127" }}>
              {item.recurrence_type}
            </span>
          </div>
          <span className="reminder-amount amount-negative" style={{ fontSize: "1.2rem", fontWeight: "600" }}>
            {formatCurrency(item.amount)}
          </span>
          <span className="muted">Due: {item.due_date}</span>
          {item.note && <span className="muted">Note: {item.note}</span>}
        </div>
        <div className="reminder-card-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-start", marginTop: "12px", justifyContent: "flex-end" }}>
          
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handleToggleStatus(item)}
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            {item.status === "pending" ? "Mark Paid" : "Mark Pending"}
          </button>
          
          <button
            className="ghost-btn"
            type="button"
            onClick={() => setEditingItem(item)}
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            Edit
          </button>

          <button
            className="danger-btn"
            type="button"
            onClick={() => handleDelete(item.id)}
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading reminders…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Due Reminders</h1>
        <p className="muted">
          Manage your upcoming payments: LIC, Insurance, EMI, and subscriptions.
        </p>
      </div>

      {/* ── Add Reminder ─────────────────────────────────── */}
      <section className="panel">
        <h3>Add Reminder</h3>
        <ReminderForm onSave={handleAdd} />
      </section>

      {/* ── Empty State ──────────────────────────────────── */}
      {reminders.length === 0 && (
        <section className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <span style={{ fontSize: "3rem" }}>📝</span>
          <p className="empty-state" style={{ marginTop: "16px" }}>
            You haven't set up any reminders yet. Add your first due reminder above!
          </p>
        </section>
      )}

      {/* ── Overdue ──────────────────────────────────────── */}
      {overdue.length > 0 && (
        <section className="panel alert-panel danger-bg">
          <h3>🚨 Overdue ({overdue.length})</h3>
          <div className="reminder-list">
            {overdue.map((r) => (
              <ReminderCard key={r.id} item={r} variant="danger" />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming (Next 7 Days) ───────────────────────── */}
      {upcoming.length > 0 && (
        <section className="panel alert-panel upcoming-bg">
          <h3>📅 Upcoming — Next 7 Days ({upcoming.length})</h3>
          <div className="reminder-list">
            {upcoming.map((r) => (
              <ReminderCard key={r.id} item={r} variant="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* ── Future ✨ ────────────────────────────────────── */}
      {future.length > 0 && (
        <section className="panel">
          <h3>📋 Future ({future.length})</h3>
          <div className="reminder-list">
            {future.map((r) => (
              <ReminderCard key={r.id} item={r} variant="future" />
            ))}
          </div>
        </section>
      )}

      {/* ── Paid ✅ ──────────────────────────────────────── */}
      {paidReminders.length > 0 && (
        <section className="panel">
          <h3>✅ Paid ({paidReminders.length})</h3>
          <div className="reminder-list">
            {paidReminders.map((r) => (
              <ReminderCard key={r.id} item={r} variant="paid" />
            ))}
          </div>
        </section>
      )}

      {/* ── Edit Modal ───────────────────────────────────── */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Reminder</h3>
              <button
                className="modal-close"
                onClick={() => setEditingItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <ReminderForm
                key={editingItem.id}
                onSave={handleUpdate}
                initialValues={editingItem}
                submitLabel="Update Reminder"
                onCancel={() => setEditingItem(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
