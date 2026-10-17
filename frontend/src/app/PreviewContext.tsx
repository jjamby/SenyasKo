import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../services/api'
import type { User } from '../services/api'

interface PreviewState {
  name: string
  user: User | null
  demo: boolean
  loading: boolean
  enterPreview: () => void
  signup: (username: string, email: string, password: string) => Promise<void>
  login: (identifier: string, password: string) => Promise<void>
  leavePreview: () => Promise<void>
}
const PreviewContext = createContext<PreviewState | null>(null)

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [demo, setDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api<User>('/auth/me').then(setUser).catch(() => {}).finally(() => setLoading(false))
  }, [])
  function enterPreview() { setDemo(true); setUser(null) }
  async function signup(username: string, email: string, password: string) {
    const next = await api<User>('/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) })
    setDemo(false); setUser(next)
  }
  async function login(identifier: string, password: string) {
    const next = await api<User>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) })
    setDemo(false); setUser(next)
  }
  async function leavePreview() {
    if (user) await api<void>('/auth/logout', { method: 'POST' })
    setUser(null); setDemo(false)
  }
  return <PreviewContext.Provider value={{ name: user?.username || 'Learner', user, demo, loading, enterPreview, signup, login, leavePreview }}>{children}</PreviewContext.Provider>
}

export function usePreview() {
  const value = useContext(PreviewContext)
  if (!value) throw new Error('usePreview must be used within PreviewProvider')
  return value
}
