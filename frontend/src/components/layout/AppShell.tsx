import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Aperture, Bell, ChevronRight, Flame, Grid2X2, Hand, Home, Inbox, LogOut, Menu } from 'lucide-react'
import { usePreview } from '../../app/PreviewContext'
import { demoProgress } from '../../data/demoContent'
import { Dialog } from '../ui/Dialog'
import './layout.css'

const navigation = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/practice', label: 'Practice', icon: Aperture },
  { path: '/collections', label: 'Collections', icon: Grid2X2 },
  { path: '/inbox', label: 'Inbox', icon: Inbox },
]

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { name, leavePreview } = usePreview()
  const location = useLocation()
  const navigate = useNavigate()
  const softened = ['/notifications', '/inbox'].includes(location.pathname)
  function leave() { leavePreview(); setMenuOpen(false); navigate('/') }
  return <div className={`app-shell ${softened ? 'app-shell--soft' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="desktop-sidebar">
      <Link to="/home" className="brand"><span className="brand-mark"><Hand /></span>SenyasKo<span className="brand-dot">.</span></Link>
      <p className="sidebar-tagline">Little signs.<br />Meaningful connections.</p>
      <nav aria-label="Main navigation">{navigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}><Icon size={21} />{label}<ChevronRight size={16} className="sidebar-chevron" /></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="preview-chip">Frontend preview</div><p>A little practice, every day.</p><button className="text-button" onClick={leave}><LogOut size={16} /> Leave preview</button></div>
    </aside>
    <div className="app-main">
      <header className="app-header"><button type="button" className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button><div className="desktop-greeting"><span>Your learning space</span><p>Good to see you, {name}.</p></div><div className="streak-badge" aria-label={`${demoProgress.streak} day streak, sample data`}><Flame fill="currentColor" /><strong>{demoProgress.streak}</strong><span>day streak</span></div></header>
      <main id="main-content" className="page-content" tabIndex={-1}><Outlet /></main>
      <footer className="preview-footer">Preview experience · sample learning progress</footer>
    </div>
    <nav className="bottom-nav" aria-label="Mobile navigation">{navigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `bottom-nav-item ${path === '/practice' ? 'bottom-nav-camera' : ''} ${isActive ? 'is-active' : ''}`} aria-label={label}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
    {menuOpen && <Dialog title="Your learning space" onClose={() => setMenuOpen(false)}><div className="menu-profile"><span className="avatar">{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><p>Preview learner</p></div></div><div className="menu-links">{navigation.map(({ path, label, icon: Icon }) => <Link key={path} to={path} onClick={() => setMenuOpen(false)}><Icon size={20} />{label}<ChevronRight size={18} /></Link>)}</div><button className="button button--dark" onClick={leave}><LogOut size={18} />Leave preview</button><p className="helper-text">Your sample progress is for exploring the design.</p></Dialog>}
  </div>
}
