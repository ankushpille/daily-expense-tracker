import { useEffect, useMemo, useState } from "react";
import { getIncome, addIncome } from "../api/incomeApi";
import {
  getRecurringSources,
  addRecurringSource,
  updateRecurringSource,
  deleteRecurringSource,
} from "../api/recurringIncomeApi";
import {
  formatCurrency,
  getRecurringStatus,
  todayString,
} from "../utils/helpers";
import { useToast } from "./Toast";

const RECURRENCE_TYPES = ["monthly", "yearly", "one-time"];
const INCOME_TYPES = ["Rental", "Loan Interest", "Salary", "Investment", "Other"];

// ── Shared Form ──────────────────────────────────────────────────
function RecurringSourceForm({
  onSave,
  initialValues,
  submitLabel = "Save Source",
  onCancel,
}) {
  const [sourceName, setSourceName] = useState(initialValues?.source_name || "");
  const [incomeType, setIncomeType] = useState(initialValues?.income_type || "Rental");
  const [expectedAmount, setExpectedAmount] = useState(initialValues?.expected_amount ? String(initialValues.expected_amount) : "");
  const [recurrenceType, setRecurrenceType] = useState(initialValues?.recurrence_type || "monthly");
  const [startDate, setStartDate] = useState(initialValues?.start_date || todayString());
  const [endDate, setEndDate] = useState(initialValues?.end_date || "");
  const [dueDay, setDueDay] = useState(initialValues?.due_day ? String(initialValues.due_day) : "");
  const [isActive, setIsActive] = useState(initialValues?.is_active !== false);
  const [note, setNote] = useState(initialValues?.note || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(expectedAmount);
    const day = parseInt(dueDay, 10);

    if (!sourceName.trim() || !isFinite(amt) || amt <= 0 || !isFinite(day) || day < 1 || day > 31) {
      return;
    }

    onSave({
      source_name: sourceName.trim(),
      income_type: incomeType,
      expected_amount: amt,
      recurrence_type: recurrenceType,
      start_date: startDate,
      end_date: endDate || null,
      due_day: day,
      is_active: isActive,
      note: note.trim(),
    });

    if (!initialValues) {
      setSourceName("");
      setIncomeType("Rental");
      setExpectedAmount("");
      setRecurrenceType("monthly");
      setStartDate(todayString());
      setEndDate("");
      setDueDay("");
      setIsActive(true);
      setNote("");
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Source Name</span>
          <input
            type="text"
            placeholder="e.g. Shop Rent"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Income Type</span>
          <select value={incomeType} onChange={(e) => setIncomeType(e.target.value)} required>
            {INCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Amount (₹)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Due Day (1-31)</span>
          <input
            type="number"
            min="1"
            max="31"
            placeholder="e.g. 5"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Recurrence</span>
          <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)} required>
            {RECURRENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Start Date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label className="field">
          <span>End Date (Optional)</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label className="field" style={{ flexDirection: "row", alignItems: "center" }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: "auto" }} />
          <span>Is Active?</span>
        </label>
      </div>
      <label className="field field-full">
        <span>Note (Optional)</span>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      
      <div className="form-actions" style={{ marginTop: "12px" }}>
        <button
          className="primary-btn"
          type="submit"
          disabled={!sourceName || !expectedAmount || !dueDay}
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
  )
}


export default function RecurringIncomePage() {
  const [sources, setSources] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srcData, incData] = await Promise.all([
        getRecurringSources(),
        getIncome(),
      ]);
      setSources(srcData || []);
      setIncome(incData || []);
    } catch (err) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Only run logic on ACTVE sources
  const activeSources = useMemo(() => sources.filter(s => s.is_active), [sources]);
  const inactiveSources = useMemo(() => sources.filter(s => !s.is_active), [sources]);

  // ── Recurring status (received / pending) ───────────────────
  const recurringStatus = useMemo(
    () => getRecurringStatus(activeSources, income),
    [activeSources, income],
  );
  
  const pendingSources = recurringStatus.filter((s) => !s.received);
  const receivedSources = recurringStatus.filter((s) => s.received);
  const totalPending = pendingSources.reduce(
    (s, r) => s + Number(r.expected_amount),
    0,
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleAddSource = async (values) => {
    try {
      const created = await addRecurringSource(values);
      setSources((prev) => [created, ...prev]);
      toast.success("Recurring source added!");
    } catch (err) {
      toast.error("Failed to add source: " + err.message);
    }
  };

  const handleUpdateSource = async (values) => {
    try {
      const updated = await updateRecurringSource(editingItem.id, values);
      setSources((prev) => prev.map(s => s.id === editingItem.id ? updated : s));
      setEditingItem(null);
      toast.success("Recurring source updated!");
    } catch(err) {
      toast.error("Failed to update source: " + err.message);
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recurring source?")) return;
    try {
      await deleteRecurringSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      toast.success("Source deleted");
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const handleMarkReceived = async (source) => {
    try {
      // Create actual income entry
      const created = await addIncome({
        amount: source.expected_amount,
        source: source.source_name,
        income_date: todayString(),
        note: `Recurring: ${source.source_name}`,
      });
      setIncome((prev) => [created, ...prev]);
      toast.success(`Marked ${source.source_name} as received!`);
    } catch (err) {
      toast.error("Failed to mark as received: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading recurring income…</p>
      </div>
    );
  }

  const SourceList = ({ items, showActions = true }) => {
    if(items.length === 0) return <p className="empty-state">No sources found.</p>;
    
    return (
      <div className="recurring-grid">
        {items.map((src) => {
          const isReceived = src.received;
          const statusBadge = src.is_active ? 
                              (isReceived ? "badge-success" : "badge-warning") 
                              : "badge-danger";
          const statusText = src.is_active ? 
                             (isReceived ? "✓ Received" : "⏳ Pending") 
                             : "Inactive";

          return (
            <div
              key={src.id}
              className={`recurring-card ${src.is_active ? (isReceived ? "received" : "pending") : "inactive"}`}
            >
              <div className="recurring-card-header">
                <strong>{src.source_name}</strong>
                <span className={`badge ${statusBadge}`}>
                  {statusText}
                </span>
              </div>
              <p className="recurring-amount" style={{ fontSize: "1.2rem", fontWeight: "600", margin: "8px 0" }}>
                {formatCurrency(src.expected_amount)}
              </p>
              <div className="recurring-meta" style={{ display: "grid", gap: "4px" }}>
                <span>Type: <b>{src.income_type}</b></span>
                <span>Due day: {src.due_day} • {src.recurrence_type}</span>
                {src.note && <span className="muted" style={{ fontStyle: "italic" }}>{src.note}</span>}
              </div>
              
              {showActions && (
                <div className="recurring-actions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                  {src.is_active && !isReceived && (
                    <button className="primary-btn" type="button" onClick={() => handleMarkReceived(src)} style={{ flex: 1, padding: "6px" }}>
                      Mark Received
                    </button>
                  )}
                  <button className="ghost-btn" type="button" onClick={() => setEditingItem(src)} style={{ flex: 1, padding: "6px" }}>
                    Edit
                  </button>
                  <button className="danger-btn" type="button" onClick={() => handleDelete(src.id)} style={{ flex: 1, padding: "6px" }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recurring Income</h1>
        <p className="muted">
          Manage rentals, loan interest, and recurring streams.
        </p>
      </div>

      {/* ── Add Form ──────────────────────────────────────── */}
      <section className="panel">
        <h3>Add Setup</h3>
        <RecurringSourceForm onSave={handleAddSource} />
      </section>

      {/* ── Pending Alerts ────────────────────────────────── */}
      {pendingSources.length > 0 && (
        <div className="panel alert-panel warning-bg">
          <h3>
            ⚠️ {pendingSources.length} Pending for {" "}
            {new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </h3>
          <p className="muted" style={{ marginBottom: "16px" }}>
            Total pending: <b>{formatCurrency(totalPending)}</b>
          </p>
          <SourceList items={pendingSources} showActions={true} />
        </div>
      )}

      {/* ── Received ──────────────────────────────────────── */}
      {receivedSources.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3>✅ Current Month Received</h3>
            <span className="badge badge-success">{receivedSources.length} items</span>
          </div>
          <SourceList items={receivedSources} showActions={true} />
        </section>
      )}

      {/* ── Inactive ──────────────────────────────────────── */}
      {inactiveSources.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3>⏸ Inactive Sources</h3>
          </div>
          <SourceList items={inactiveSources} showActions={true} />
        </section>
      )}

      {/* ── Empty check ───────────────────────────────────── */}
      {sources.length === 0 && (
         <section className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
         <span style={{ fontSize: "3rem" }}>🔁</span>
         <p className="empty-state" style={{ marginTop: "16px" }}>
            No recurring streams detected. Establish a reliable income above!
         </p>
       </section>
      )}

      {/* ── Edit Modal ───────────────────────────────────── */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Recurring Source</h3>
              <button
                className="modal-close"
                onClick={() => setEditingItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <RecurringSourceForm
                key={editingItem.id}
                initialValues={editingItem}
                submitLabel="Update Source"
                onSave={handleUpdateSource}
                onCancel={() => setEditingItem(null)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
