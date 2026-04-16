/**
 * Sidebar — Collapsible left navigation with menu items, user info, and logout.
 *
 * Props:
 *   activePage      – currently selected page key
 *   onNavigate      – callback when a menu item is clicked
 *   collapsed       – whether sidebar is in icon-only mode (desktop)
 *   onToggleCollapse – toggle collapsed state
 *   user            – Supabase user object
 *   onLogout        – logout handler
 *   mobileOpen      – whether sidebar is visible on mobile
 *   badges          – optional { [pageKey]: number } for notification badges
 */

// ── SVG Icons (Feather/Lucide style, 20×20) ─────────────────────
const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  income: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  expenses: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  recurring: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  reminders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  feedback: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  collapse: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  expand: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

// ── Menu items ──────────────────────────────────────────────────
const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "income", label: "Income", icon: "income" },
  { key: "expenses", label: "Expenses", icon: "expenses" },
  { key: "recurring", label: "Recurring Income", icon: "recurring" },
  { key: "reminders", label: "Reminders", icon: "reminders" },
  { key: "feedback", label: "Feedback", icon: "feedback" },
];

// ── Component ───────────────────────────────────────────────────
export default function Sidebar({
  activePage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  mobileOpen,
  badges = {},
}) {
  const cls = [
    "sidebar",
    collapsed ? "collapsed" : "",
    mobileOpen ? "mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={cls}>
      {/* ── Header / Logo ────────────────────────────────── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">💰</span>
          {!collapsed && <span className="logo-text">ExpenseTracker</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? ICONS.expand : ICONS.collapse}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.key}
            id={`nav-${item.key}`}
            className={`sidebar-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-icon">{ICONS[item.icon]}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
            {badges[item.key] > 0 && (
              <span className="sidebar-badge">{badges[item.key]}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Footer / User ────────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-user" title={user?.email}>
          <span className="sidebar-avatar">
            {(user?.email || "U")[0].toUpperCase()}
          </span>
          {!collapsed && (
            <span className="sidebar-email">{user?.email}</span>
          )}
        </div>
        <button
          id="sidebar-logout-btn"
          className="sidebar-item sidebar-logout-item"
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <span className="sidebar-icon">{ICONS.logout}</span>
          {!collapsed && <span className="sidebar-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
