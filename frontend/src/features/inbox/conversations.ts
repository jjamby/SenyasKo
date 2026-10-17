import type { Message } from '../../services/api'

export interface Conversation {
  name: string
  messages: Message[]
  latest: Message
  unread: number
}

export function buildConversations(messages: Message[], username: string): Conversation[] {
  const byPerson = new Map<string, { name: string; messages: Message[] }>()
  for (const message of messages) {
    const name = message.sender.toLowerCase() === username.toLowerCase() ? message.recipient : message.sender
    const key = name.toLowerCase()
    const existing = byPerson.get(key)
    if (existing) existing.messages.push(message)
    else byPerson.set(key, { name, messages: [message] })
  }
  return [...byPerson.values()].map(({ name, messages: thread }) => {
    thread.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
    return {
      name,
      messages: thread,
      latest: thread[thread.length - 1],
      unread: thread.filter((message) => message.recipient.toLowerCase() === username.toLowerCase() && message.unread).length,
    }
  }).sort((a, b) => b.latest.date.localeCompare(a.latest.date) || b.latest.id - a.latest.id)
}
