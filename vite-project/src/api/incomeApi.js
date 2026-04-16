import { supabase } from "../supabase/client";

/**
 * Fetch all income entries for the current user, newest first.
 */
export async function getIncome() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("income_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("income_date", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Insert a new income entry for the current user.
 * @param {{ amount: number, source: string, income_date: string, note?: string }} entry
 */
export async function addIncome(entry) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("income_entries")
    .insert({
      user_id: user.id,
      amount: entry.amount,
      source: entry.source,
      income_date: entry.income_date,
      note: entry.note || "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing income entry by id.
 */
export async function updateIncome(id, updates) {
  const { data, error } = await supabase
    .from("income_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a single income entry by id.
 */
export async function deleteIncome(id) {
  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Delete all income entries for the current user.
 */
export async function deleteAllIncome() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
