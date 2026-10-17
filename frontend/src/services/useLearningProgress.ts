import { useEffect, useState } from 'react'
import { usePreview } from '../app/PreviewContext'
import { api } from './api'
import type { Progress } from './api'

const empty: Progress = { collections: {}, completed_lessons: [], experience: 0 }

export function useLearningProgress() {
  const { user } = usePreview()
  const [progress, setProgress] = useState<Progress>(empty)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user) return
    let live = true
    api<Progress>('/progress').then((value) => { if (live) setProgress(value) }).catch((reason: Error) => { if (live) setError(reason.message) })
    return () => { live = false }
  }, [user])
  return { progress, error }
}
