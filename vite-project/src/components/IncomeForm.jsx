import { useMemo, useState } from "react";

const todayString = () => new Date().toISOString().split("T")[0];

const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Refund",
  "Rental",
  "Loan Interest",
  "Other",
];

export default function IncomeForm({
  onAdd,
  initialValues,
  submitLabel = "Add income",
  onCancel,
}) {
  const [amount, setAmount] = useState(
    initialValues?.amount ? String(initialValues.amount) : "",
  );
  const [source, setSource] = useState(initialValues?.source || "");
  const [date, setDate] = useState(
    initialValues?.income_date || todayString(),
  );
  const [note, setNote] = useState(initialValues?.note || "");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const parsed = Number.parseFloat(amount);
    return Number.isFinite(parsed) && parsed > 0 && source && date;
  }, [amount, source, date]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = Number.parseFloat(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!source) {
      setError("Pick a source.");
      return;
    }
    if (!date) {
      setError("Pick a date.");
      return;
    }

    setError("");
    onAdd({
      amount: parsed,
      source,
      income_date: date,
      note: note.trim(),
    });

    // Don't reset form when editing
    if (initialValues) return;

    setAmount("");
    setSource("");
    setDate(todayString());
    setNote("");
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Amount</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Source</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            required
          >
            <option value="">Select source</option>
            {INCOME_SOURCES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
      </div>
      <label className="field field-full">
        <span>Note</span>
        <input
          type="text"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        <button className="primary-btn" type="submit" disabled={!canSubmit}>
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
