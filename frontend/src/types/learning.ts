export type CollectionId = 'alphabet' | 'numbers' | 'greetings' | 'expressions' | 'introductions'

export interface Collection {
  id: CollectionId
  title: string
  description: string
  progress: number
  lessons: string[]
}

export interface InboxMessage {
  id: string
  sender: string
  initials: string
  subject: string
  date: string
  preview: string
  body: string
  unread: boolean
}

export interface MessageDraft {
  recipient: string
  subject: string
  body: string
}
