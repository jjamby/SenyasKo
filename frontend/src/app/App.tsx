import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { PreviewProvider, usePreview } from "./PreviewContext";
import { AppShell } from "../components/layout/AppShell";
import { AuthLayout } from "../features/auth/AuthLayout";
import { AuthPage, ForgotPasswordPage } from "../features/auth/AuthPage";
import { NotificationsPage } from "../features/notifications/NotificationsPage";
import { InboxPage } from "../features/inbox/InboxPage";
import { TranscriptionPage } from "../features/transcription/TranscriptionPage";
import { Link } from "react-router-dom";

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Live FSL transcript",
      "/transcribe": "Live FSL transcript",
      "/login": "Log in",
      "/signup": "Sign up",
      "/forgot-password": "Reset password",
      "/inbox": "Inbox",
      "/notifications": "Notifications",
    };
    document.title = `${titles[pathname] || "Sign to text"} · SenyasKo`;
    const heading = document.querySelector<HTMLElement>("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function ProtectedApp() {
  const { user, demo, loading } = usePreview();
  if (loading)
    return (
      <main className="auth-layout">
        <p role="status">Loading your account…</p>
      </main>
    );
  return user || demo ? <AppShell /> : <Navigate to="/login" replace />;
}
function AccountArea() {
  return (
    <PreviewProvider>
      <Outlet />
    </PreviewProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <Routes>
        <Route index element={<TranscriptionPage />} />
        <Route path="transcribe" element={<TranscriptionPage />} />
        {["home", "practice", "collections", "collections/:collectionId"].map(
          (path) => (
            <Route
              key={path}
              path={path}
              element={<Navigate to="/transcribe" replace />}
            />
          ),
        )}
        <Route element={<AccountArea />}>
          <Route element={<AuthLayout />}>
            <Route
              path="login"
              element={<AuthPage key="login" mode="login" />}
            />
            <Route
              path="signup"
              element={<AuthPage key="signup" mode="signup" />}
            />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route element={<ProtectedApp />}>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="inbox" element={<InboxPage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <section className="glass-card search-empty">
              <h1>Page not found.</h1>
              <Link to="/transcribe" className="button button--dark">
                Open live transcript
              </Link>
            </section>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
