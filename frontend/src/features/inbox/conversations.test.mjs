import test from 'node:test'
import assert from 'node:assert/strict'
import { buildConversations } from './conversations.ts'

test('sent and received messages form one conversation per person', () => {
  const messages = [
    { id: 1, sender: 'Alice', recipient: 'Bob', subject: 'Hello', body: 'First', date: '2026-01-01T10:00:00Z', unread: false },
    { id: 2, sender: 'Bob', recipient: 'Alice', subject: 'Re: Hello', body: 'Second', date: '2026-01-01T11:00:00Z', unread: true },
    { id: 3, sender: 'Alice', recipient: 'Cara', subject: 'Hi', body: 'Third', date: '2026-01-02T10:00:00Z', unread: false },
  ]
  const conversations = buildConversations(messages, 'Alice')
  assert.deepEqual(conversations.map((item) => item.name), ['Cara', 'Bob'])
  assert.deepEqual(conversations[1].messages.map((item) => item.id), [1, 2])
  assert.equal(conversations[1].unread, 1)
  assert.equal(conversations[0].unread, 0)
})
