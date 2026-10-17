import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { usePreview } from '../../app/PreviewContext'
import { AuthField } from './AuthField'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signup: createAccount, login } = usePreview()
  const navigate = useNavigate()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('username') || '').trim()
    if (name.length < 2) return setError('Please enter a username with at least 2 characters.')
    if (signup && data.get('password') !== data.get('confirmPassword')) return setError('Your passwords don’t match. Please try again.')
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    setSubmitting(true)
    try {
      if (signup) await createAccount(name, email, password)
      else await login(name, password)
      navigate('/home')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not connect to your account.')
    } finally { setSubmitting(false) }
  }
  return <div className={`auth-page auth-page--${mode}`}><Link to="/" className="icon-button auth-back" aria-label="Back to welcome"><ArrowLeft /></Link><div className="auth-form-heading"><h1>{signup ? 'Sign up' : 'Log in'}</h1><p>{signup ? 'Your next connection starts here.' : 'A little more practice. A little more possibility.'}</p></div><form className="auth-form" onSubmit={submit} onChange={() => setError('')}><div className="auth-fields"><AuthField label="Username" icon={UserRound} name="username" autoComplete="username" required minLength={2} maxLength={40} />{signup && <AuthField label="Email Address" icon={Mail} name="email" type="email" autoComplete="email" required />}<AuthField label="Password" icon={LockKeyhole} name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} />{signup && <AuthField label="Confirm Password" icon={LockKeyhole} name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />}</div>{!signup && <Link className="forgot-link" to="/forgot-password">Forgot Password?</Link>}{error && <p className="form-error" role="alert">{error}</p>}<div className="auth-submit"><button className="button button--dark" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : signup ? 'Sign up' : 'Log in'}</button></div></form><p className="auth-switch">{signup ? 'Already have an account?' : 'New to SenyasKo?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Sign up'}</Link></p></div>
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  return <div className="auth-page auth-page--reset"><Link to="/login" className="icon-button auth-back" aria-label="Back to login"><ArrowLeft /></Link><div className="auth-form-heading"><h1>A fresh start.</h1><p>Forgot your password? It happens.</p></div><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><AuthField name="email" label="Email Address" icon={Mail} type="email" autoComplete="email" required /><button className="button button--dark" type="submit">Reset password</button>{submitted && <p className="status-message" role="status">Password reset will be available when account services are connected. No email has been sent.</p>}<Link className="text-link" to="/login">Back to log in</Link></form></div>
}
