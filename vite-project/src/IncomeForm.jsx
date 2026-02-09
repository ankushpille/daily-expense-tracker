import { useMemo, useState } from "react";

const todayString = () => new Date().toISOString().split("T")[0];

export default function IncomeForm({ onAdd, incomeSources }) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const parsedAmount = Number.parseFloat(amount);
    return Number.isFinite(parsedAmount) && parsedAmount > 0 && source && date;
  }, [amount, source, date]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
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
      amount: parsedAmount,
      source,
      date,
      note: note.trim(),
    });

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
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Source</span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            required
          >
            <option value="">Select source</option>
            {incomeSources.map((option) => (
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
      </div>
      <label className="field field-full">
        <span>Note</span>
        <input
          type="text"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-btn" type="submit" disabled={!canSubmit}>
        Add income
      </button>
    </form>
  );
}
