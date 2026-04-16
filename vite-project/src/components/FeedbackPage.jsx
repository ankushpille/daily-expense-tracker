import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { submitFeedback } from "../api/feedbackApi";
import { useToast } from "./Toast";

const FEEDBACK_TYPES = ["Feature Request", "Bug", "Other"];

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackType, setFeedbackType] = useState("Feature Request");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    // Autofill name and email from active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
        setName(user.user_metadata?.full_name || "");
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.warning("Please enter your feedback message.");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        name: name.trim(),
        email: email.trim(),
        feedback_type: feedbackType,
        message: message.trim(),
      });
      toast.success("Thank you for your feedback!");
      setMessage("");
      setSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit feedback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Feedback</h1>
        <p className="muted">Help us improve — share your thoughts</p>
      </div>

      <section className="panel feedback-panel" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {submitted ? (
          <div className="feedback-success" style={{ textAlign: "center", padding: "40px 20px" }}>
            <span className="feedback-success-icon" style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>🎉</span>
            <h3>Thank You!</h3>
            <p className="muted" style={{ marginBottom: "24px" }}>Your feedback has been submitted successfully.</p>
            <button
              className="primary-btn"
              type="button"
              onClick={() => setSubmitted(false)}
            >
              Send More Feedback
            </button>
          </div>
        ) : (
          <form className="expense-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
            
            <label className="field field-full">
              <span>Feedback Type</span>
              <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)}>
                {FEEDBACK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="field field-full">
              <span>Your Feedback Message</span>
              <textarea
                placeholder="Tell us what you think, report bugs, or suggest features…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </label>

            <div style={{ marginTop: "12px" }}>
              <button
                className="primary-btn"
                type="submit"
                style={{ width: "100%", padding: "14px" }}
                disabled={submitting || !message.trim()}
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
