import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, Hand, Inbox, LogOut, ScanLine } from "lucide-react";
import { usePreview } from "../../app/PreviewContext";
import "./layout.css";

const navigation = [
  { path: "/transcribe", label: "Live transcript", icon: ScanLine },
  { path: "/inbox", label: "Inbox", icon: Inbox },
  { path: "/notifications", label: "Notifications", icon: Bell },
];
export function AppShell() {
  const { name, user, leavePreview } = usePreview();
  const navigate = useNavigate();
  async function leave() {
    try {
      await leavePreview();
      navigate("/");
    } catch {
      window.alert("Could not sign out. Please try again.");
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="desktop-sidebar">
        <Link to="/transcribe" className="brand">
          <span className="brand-mark">
            <Hand />
          </span>
          SenyasKo
        </Link>
        <p className="sidebar-tagline">Signs into words.</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>{user ? "Your account" : "Preview account"}</p>
          <button className="text-button" onClick={leave}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <Link to="/transcribe" className="text-link">
            Live transcript
          </Link>
          <p>{name}</p>
        </header>
        <main id="main-content" className="page-content">
          <Outlet />
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className="bottom-nav-item">
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
