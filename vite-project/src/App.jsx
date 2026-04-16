import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import { signOut } from "./auth/authService";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import IncomePage from "./components/IncomePage";
import ExpensePage from "./components/ExpensePage";
import RecurringIncomePage from "./components/RecurringIncomePage";
import RemindersPage from "./components/RemindersPage";
import FeedbackPage from "./components/FeedbackPage";
import Sidebar from "./components/Sidebar";
import { ToastProvider, useToast } from "./components/Toast";
import "./App.css";

// ── Main app content (needs to be inside ToastProvider) ──────────
function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toast = useToast();

  // ── Auth session management ─────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auto-create profile on login (frontend fallback) ────────
  useEffect(() => {
    if (!session?.user) return;
    const user = session.user;

    supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || "",
              currency: "INR", // Default currency
            })
            .then(({ error }) => {
              if (error) console.warn("Profile creation failed:", error.message);
            });
        }
      });
  }, [session]);

  // ── Handlers ────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    setSession(null);
    toast.success("Logged out successfully");
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Checking authentication…</p>
        </div>
      </div>
    );
  }

  // ── Not logged in ───────────────────────────────────────────
  if (!session) {
    return <AuthPage />;
  }

  // ── Page renderer ───────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "income": return <IncomePage />;
      case "expenses": return <ExpensePage />;
      case "recurring": return <RecurringIncomePage />;
      case "reminders": return <RemindersPage />;
      case "feedback": return <FeedbackPage />;
      default: return <DashboardPage />;
    }
  };

  // ── Layout ──────────────────────────────────────────────────
  return (
    <div
      className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {/* Mobile top bar — visible only on small screens */}
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="mobile-title">💰 ExpenseTracker</span>
      </div>

      {/* Dark backdrop when mobile sidebar is open */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={session.user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
      />

      {/* Page content */}
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

// ── Root component (wraps everything in ToastProvider) ───────────
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
