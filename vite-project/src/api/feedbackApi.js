import { supabase } from "../supabase/client";

/**
 * Submit user feedback to the user_feedback table.
 * Exact columns: user_id, name, email, feedback_type, message
 */
export async function submitFeedback({ name, email, feedback_type, message }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Enforce valid feedback type fallback
  const validTypes = ["Bug", "Feature Request", "Other"];
  const typeValue = validTypes.includes(feedback_type) ? feedback_type : "Other";

  const { data, error } = await supabase
    .from("user_feedback")
    .insert({
      user_id: user.id,
      name: name || user.user_metadata?.full_name || "",
      email: email || user.email || "",
      feedback_type: typeValue,
      message: message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
