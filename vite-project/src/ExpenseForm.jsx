import { useMemo, useState } from "react";

const todayString = () => new Date().toISOString().split("T")[0];

export default function ExpenseForm({
  onAdd,
  categories,
  paymentModes,
  initialValues,
  submitLabel = "Add expense",
  onCancel,
}) {
  const [amount, setAmount] = useState(
    initialValues?.amount ? String(initialValues.amount) : "",
  );
  const [category, setCategory] = useState(initialValues?.category || "");
  const [date, setDate] = useState(initialValues?.date || todayString());
  const [description, setDescription] = useState(
    initialValues?.description || "",
  );
  const [paymentMode, setPaymentMode] = useState(
    initialValues?.paymentMode || "",
  );
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const parsedAmount = Number.parseFloat(amount);
    return (
      Number.isFinite(parsedAmount) &&
      parsedAmount > 0 &&
      category &&
      paymentMode &&
      date
    );
  }, [amount, category, paymentMode, date]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
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
      amount: parsedAmount,
      category,
      date,
      description: description.trim(),
      paymentMode,
    });

    if (initialValues) {
      return;
    }

    setAmount("");
    setCategory("");
    setDate(todayString());
    setDescription("");
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
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="">Select category</option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Payment mode</span>
          <select
            value={paymentMode}
            onChange={(event) => setPaymentMode(event.target.value)}
            required
          >
            <option value="">Select payment mode</option>
            {paymentModes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field field-full">
        <span>Description</span>
        <input
          type="text"
          placeholder="Add a note (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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
