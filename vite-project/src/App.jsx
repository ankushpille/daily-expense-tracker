import { useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import { signOut } from "./auth/authService";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <Dashboard user={session.user} onLogout={handleLogout} />;
}

export default App;
