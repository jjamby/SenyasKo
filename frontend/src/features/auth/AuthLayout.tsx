import { Link, Outlet } from 'react-router-dom'
import { Hand } from 'lucide-react'
import './auth.css'

export function AuthLayout() {
  return <main className="auth-layout"><aside className="auth-story"><Link className="brand" to="/"><span className="brand-mark"><Hand /></span>SenyasKo<span className="brand-dot">.</span></Link><div className="auth-story-copy"><span className="eyebrow">EVERY SIGN IS A CONNECTION</span><h2>A little practice.<br />A world of<br /><em>understanding.</em></h2><p>Your space to learn, practice, and connect<br />through Filipino Sign Language.</p></div><span className="auth-story-footer">Made for connection. Made for you.</span></aside><section className="auth-screen"><Outlet /></section></main>
}
