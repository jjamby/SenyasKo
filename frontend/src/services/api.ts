export interface User { id: number; username: string; email: string }
export interface Message { id: number; sender: string; recipient: string; subject: string; body: string; date: string; unread: boolean }
export interface Draft { id: number; recipient: string; subject: string; body: string; updated_at: string }
export interface Progress { collections: Record<string, number>; completed_lessons: { collection_id: string; lesson: string }[]; experience: number }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    throw new Error('Cannot reach the SenyasKo server. Start the backend and try again.')
  }
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : 'The request could not be completed.'
    throw new Error(detail)
  }
  return data as T
}
