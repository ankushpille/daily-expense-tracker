import { useState, useEffect } from "react";

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
  const [paymentMode, setPaymentMode] = useState(
    initialValues?.payment_mode || "",
  );
  const [date, setDate] = useState(
    initialValues?.expense_date || new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState(initialValues?.note || "");
  const [error, setError] = useState("");

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!category) {
      setError("Please select a category.");
      return;
    }
    if (!paymentMode) {
      setError("Please select a payment mode.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }

    setError("");
    onAdd({
      amount: parsedAmount,
      category,
      payment_mode: paymentMode,
      expense_date: date,
      note: note.trim(),
    });

    // Don't reset if we are editing
    if (initialValues) return;

    setAmount("");
    setCategory("");
    setPaymentMode("");
    setDate(new Date().toISOString().split("T")[0]);
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
          <span>Payment Mode</span>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            required
          >
            <option value="">Select mode</option>
            {PAYMENT_MODES.map((opt) => (
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
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button
          className="primary-btn"
          type="submit"
          disabled={!amount || !category || !paymentMode || !date}
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
