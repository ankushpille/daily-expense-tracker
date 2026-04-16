import { supabase } from "../supabase/client";

/**
 * Fetch all recurring income sources for the current user.
 */
export async function getRecurringSources() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("recurring_income_sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add a new recurring income source.
 * Exact columns: source_name, income_type, expected_amount, recurrence_type, start_date, end_date, due_day, is_active, note.
 */
export async function addRecurringSource(source) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("recurring_income_sources")
    .insert({
      user_id: user.id,
      source_name: source.source_name,
      income_type: source.income_type || "Other",
      expected_amount: source.expected_amount,
      recurrence_type: source.recurrence_type || "monthly",
      start_date: source.start_date,
      end_date: source.end_date || null,
      due_day: source.due_day,
      is_active: source.is_active !== undefined ? source.is_active : true,
      note: source.note || "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing recurring income source
 */
export async function updateRecurringSource(id, updates) {
  const payload = { ...updates };

  // Safety mappings
  if (payload.frequency) {
    payload.recurrence_type = payload.frequency;
    delete payload.frequency;
  }
  if (payload.notes !== undefined) {
    if (payload.note === undefined) {
      payload.note = payload.notes;
    }
    delete payload.notes;
  }

  const { data, error } = await supabase
    .from("recurring_income_sources")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a recurring income source by id.
 */
export async function deleteRecurringSource(id) {
  const { error } = await supabase
    .from("recurring_income_sources")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
