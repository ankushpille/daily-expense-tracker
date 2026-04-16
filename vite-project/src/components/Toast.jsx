import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

/**
 * Hook to show toast notifications from any component.
 * Usage: const toast = useToast();  toast.success("Done!");
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 0;

/**
 * Wrap your app in <ToastProvider> to enable toast notifications.
 * Renders toast messages in a fixed container at bottom-right.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error"),
      warning: (msg) => addToast(msg, "warning"),
      info: (msg) => addToast(msg, "info"),
    }),
    [addToast],
  );

  const TOAST_ICONS = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{TOAST_ICONS[t.type]}</span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
