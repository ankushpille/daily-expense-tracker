/**
 * Shared helper utilities for the Daily Expense Tracker.
 */

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export const todayString = () => new Date().toISOString().split("T")[0];

export const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (monthKey) => {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
};

/**
 * Compare recurring income sources with actual income entries
 * for the current month. Returns each source with a `received` boolean.
 */
export function getRecurringStatus(recurringSources, incomeEntries) {
  const mk = currentMonthKey();
  return recurringSources.map((source) => {
    const received = incomeEntries.some(
      (entry) =>
        entry.income_date?.startsWith(mk) &&
        entry.source?.toLowerCase().trim() ===
          source.source_name?.toLowerCase().trim(),
    );
    return { ...source, received };
  });
}

/**
 * Categorize reminders into overdue, upcoming (next 7 days), and future.
 */
export function categorizeReminders(reminders) {
  const today = todayString();
  const next7 = new Date();
  next7.setDate(next7.getDate() + 7);
  const next7Str = next7.toISOString().split("T")[0];

  const overdue = [];
  const upcoming = [];
  const future = [];

  reminders.forEach((r) => {
    if (r.status === "paid") return;
    if (r.due_date < today) overdue.push(r);
    else if (r.due_date <= next7Str) upcoming.push(r);
    else future.push(r);
  });

  return { overdue, upcoming, future };
}
