import { useMemo, useState } from "react";

const todayString = () => new Date().toISOString().split("T")[0];

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

export default function ExpenseForm({
  onAdd,
  initialValues,
  submitLabel = "Add expense",
  onCancel,
}) {
  const [amount, setAmount] = useState(
    initialValues?.amount ? String(initialValues.amount) : "",
  );
  const [category, setCategory] = useState(initialValues?.category || "");
  const [date, setDate] = useState(
    initialValues?.expense_date || todayString(),
  );
  const [note, setNote] = useState(initialValues?.note || "");
  const [paymentMode, setPaymentMode] = useState(
    initialValues?.payment_mode || "",
  );
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const parsed = Number.parseFloat(amount);
    return (
      Number.isFinite(parsed) && parsed > 0 && category && paymentMode && date
    );
  }, [amount, category, paymentMode, date]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = Number.parseFloat(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!category) {
      setError("Pick a category.");
      return;
    }
    if (!paymentMode) {
      setError("Pick a payment mode.");
      return;
    }
    if (!date) {
      setError("Pick a date.");
      return;
    }

    setError("");
    onAdd({
      amount: parsed,
      category,
      expense_date: date,
      note: note.trim(),
      payment_mode: paymentMode,
    });

    if (initialValues) return;

    setAmount("");
    setCategory("");
    setDate(todayString());
    setNote("");
    setPaymentMode("");
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
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category</option>
            {CATEGORIES.map((opt) => (
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
        <label className="field">
          <span>Payment mode</span>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            required
          >
            <option value="">Select payment mode</option>
            {PAYMENT_MODES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
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
        {onCancel ? (
          <button className="ghost-btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
