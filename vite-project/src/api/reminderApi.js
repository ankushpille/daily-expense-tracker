import { supabase } from "../supabase/client";

/**
 * Fetch all due reminders for the current user, ordered by due_date.
 */
export async function getReminders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("due_reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Add a new due reminder.
 */
export async function addReminder(reminder) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const validDueTypes = ["Insurance", "LIC", "Subscription", "EMI", "Other"];
  const dueType = validDueTypes.includes(reminder.due_type) ? reminder.due_type : "Other";

  const { data, error } = await supabase
    .from("due_reminders")
    .insert({
      user_id: user.id,
      title: reminder.title,
      due_type: dueType,
      amount: reminder.amount,
      due_date: reminder.due_date,
      recurrence_type: reminder.recurrence_type || "one-time",
      status: reminder.status || "pending",
      note: reminder.note || "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a reminder (e.g., edit fields or mark as paid).
 */
export async function updateReminder(id, updates) {
  const payload = { ...updates };

  const validDueTypes = ["Insurance", "LIC", "Subscription", "EMI", "Other"];
  if (payload.due_type && !validDueTypes.includes(payload.due_type)) {
    payload.due_type = "Other";
  }

  // Prevent incorrect 'notes' mapping internally
  if (payload.notes !== undefined) {
    if (payload.note === undefined) {
      payload.note = payload.notes;
    }
    delete payload.notes;
  }

  const { data, error } = await supabase
    .from("due_reminders")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a reminder by id.
 */
export async function deleteReminder(id) {
  const { error } = await supabase
    .from("due_reminders")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
