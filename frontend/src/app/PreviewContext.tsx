import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { clearPreviewName, readPreviewName, savePreviewName } from '../services/previewStorage'

interface PreviewState { name: string; enterPreview: (name?: string) => void; leavePreview: () => void }
const PreviewContext = createContext<PreviewState | null>(null)

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState(readPreviewName)
  function enterPreview(nextName = 'Learner') { savePreviewName(nextName); setName(nextName.trim() || 'Learner') }
  function leavePreview() { clearPreviewName(); setName('Learner') }
  return <PreviewContext.Provider value={{ name, enterPreview, leavePreview }}>{children}</PreviewContext.Provider>
}

export function usePreview() {
  const value = useContext(PreviewContext)
  if (!value) throw new Error('usePreview must be used within PreviewProvider')
  return value
}
