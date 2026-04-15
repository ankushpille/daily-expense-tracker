import { supabase } from "../supabase/client";

/**
 * Fetch all expenses for the current user, newest first.
 * RLS ensures only the logged-in user's rows are returned.
 */
export async function getExpenses() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Insert a new expense for the current user.
 * @param {{ amount: number, category: string, payment_mode: string, expense_date: string, note?: string }} expense
 */
export async function addExpense(expense) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount: expense.amount,
      category: expense.category,
      payment_mode: expense.payment_mode,
      expense_date: expense.expense_date,
      note: expense.note || "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing expense by id.
 */
export async function updateExpense(id, updates) {
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a single expense by id.
 */
export async function deleteExpense(id) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Delete all expenses for the current user.
 */
export async function deleteAllExpenses() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
