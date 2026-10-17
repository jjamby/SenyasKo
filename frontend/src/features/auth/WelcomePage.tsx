import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Hand } from 'lucide-react'
import { usePreview } from '../../app/PreviewContext'

export function WelcomePage() {
  const { enterPreview } = usePreview()
  const navigate = useNavigate()
  return <div className="welcome-page"><span className="mobile-brand"><Hand size={18} /> SenyasKo</span><div className="welcome-heading"><h1>Welcome!</h1><p>Every connection begins with a sign.</p></div><div className="welcome-actions"><Link className="button button--glass" to="/signup">Create Account</Link><Link className="button button--warm" to="/login">Log in</Link><button className="welcome-demo" onClick={() => { enterPreview(); navigate('/home') }}>Explore the demo <ArrowRight size={17} /></button></div><p className="auth-footnote">Learn a little. Connect a little more.</p></div>
}
