import type { MessageDraft } from '../types/learning'

const draftKey = 'senyasko.preview.draft'

export function readDraft(): MessageDraft {
  const empty = { recipient: '', subject: '', body: '' }
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(draftKey) || 'null')
    if (value && typeof value === 'object' && 'recipient' in value && 'subject' in value && 'body' in value && typeof value.recipient === 'string' && typeof value.subject === 'string' && typeof value.body === 'string') return { recipient: value.recipient, subject: value.subject, body: value.body }
  } catch { /* Ignore a missing or malformed preview draft. */ }
  return empty
}

export function saveDraft(draft: MessageDraft): boolean {
  try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); return true } catch { return false }
}
