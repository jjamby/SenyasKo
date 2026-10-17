import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { PreviewProvider, usePreview } from './PreviewContext'
import { AppShell } from '../components/layout/AppShell'
import { AuthLayout } from '../features/auth/AuthLayout'
import { WelcomePage } from '../features/auth/WelcomePage'
import { AuthPage, ForgotPasswordPage } from '../features/auth/AuthPage'
import { HomePage } from '../features/home/HomePage'
import { CollectionsPage, CollectionDetailPage } from '../features/collections/CollectionsPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { InboxPage } from '../features/inbox/InboxPage'
import { PracticePage } from '../features/practice/PracticePage'
import { Link } from 'react-router-dom'

function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Welcome', '/login': 'Log in', '/signup': 'Sign up', '/forgot-password': 'Reset password', '/home': 'Home', '/collections': 'Collections', '/inbox': 'Inbox', '/notifications': 'Notifications', '/practice': 'Practice' }
    document.title = `${titles[pathname] || 'Your learning space'} · SenyasKo`
    const heading = document.querySelector<HTMLElement>('h1')
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function ProtectedApp() {
  const { user, demo, loading } = usePreview()
  if (loading) return <main className="auth-layout"><p role="status">Loading your account…</p></main>
  return user || demo ? <AppShell /> : <Navigate to="/login" replace />
}

export default function App() {
  return <BrowserRouter><PreviewProvider><RouteEffects /><Routes><Route element={<AuthLayout />}><Route index element={<WelcomePage />} /><Route path="login" element={<AuthPage key="login" mode="login" />} /><Route path="signup" element={<AuthPage key="signup" mode="signup" />} /><Route path="forgot-password" element={<ForgotPasswordPage />} /></Route><Route element={<ProtectedApp />}><Route path="home" element={<HomePage />} /><Route path="collections" element={<CollectionsPage />} /><Route path="collections/:collectionId" element={<CollectionDetailPage />} /><Route path="notifications" element={<NotificationsPage />} /><Route path="inbox" element={<InboxPage />} /><Route path="practice" element={<PracticePage />} /><Route path="*" element={<section className="glass-card search-empty"><h1>A little off the path.</h1><p>We couldn’t find that page.</p><Link to="/home" className="button button--dark">Back to home</Link></section>} /></Route></Routes></PreviewProvider></BrowserRouter>
}
