import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, MessageCircle, Plus, Save, Send } from 'lucide-react'
import { usePreview } from '../../app/PreviewContext'
import { inboxMessages } from '../../data/demoContent'
import { Dialog } from '../../components/ui/Dialog'
import { api } from '../../services/api'
import type { Draft, Message } from '../../services/api'
import { readDraft, saveDraft } from '../../services/previewStorage'
import type { MessageDraft } from '../../types/learning'
import { buildConversations } from './conversations'
import './inbox.css'

const blank: MessageDraft = { recipient: '', subject: '', body: '' }
const formatTime = (date: string) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date))
const formatDay = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
const demoMessages: Message[] = inboxMessages.map((item) => ({
  id: Number(item.id), sender: item.sender, recipient: 'Learner', subject: item.subject,
  body: item.body, date: `${item.date}T00:00:00Z`, unread: item.unread,
}))

export function InboxPage() {
  const { user } = usePreview()
  const [messages, setMessages] = useState<Message[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [activePeer, setActivePeer] = useState<string | null>(null)
  const [showDrafts, setShowDrafts] = useState(false)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState<MessageDraft>(blank)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [matches, setMatches] = useState<{ id: number; username: string }[]>([])
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    let live = true
    const refresh = () => {
      Promise.all([
        api<Message[]>('/messages?folder=inbox'),
        api<Message[]>('/messages?folder=sent'),
        api<Draft[]>('/drafts'),
      ]).then(([received, sent, saved]) => {
        if (live) { setMessages([...received, ...sent]); setDrafts(saved) }
      }).catch((reason: Error) => { if (live) setError(reason.message) })
    }
    refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => { live = false; window.clearInterval(timer) }
  }, [user])

  useEffect(() => {
    if (!user || !composing || draft.recipient.trim().length < 2) return
    let live = true
    const timer = window.setTimeout(() => {
      api<{ id: number; username: string }[]>(`/users?q=${encodeURIComponent(draft.recipient)}`)
        .then((result) => { if (live) setMatches(result) }).catch(() => { if (live) setMatches([]) })
    }, 200)
    return () => { live = false; window.clearTimeout(timer) }
  }, [user, composing, draft.recipient])

  const conversations = useMemo(() => buildConversations(user ? messages : demoMessages, user?.username || 'Learner'), [messages, user])
  const selectedName = activePeer || conversations[0]?.name
  const conversation = conversations.find((item) => item.name.toLowerCase() === selectedName?.toLowerCase())
  const threadOpen = activePeer !== null

  useEffect(() => {
    if (!user || !conversation || !threadOpen) return
    const unread = conversation.messages.filter((message) => message.recipient.toLowerCase() === user.username.toLowerCase() && message.unread)
    if (!unread.length) return
    Promise.all(unread.map((message) => api<Message>(`/messages/${message.id}/read`, { method: 'POST' })))
      .then((updated) => setMessages((old) => old.map((message) => updated.find((item) => item.id === message.id) || message)))
      .catch((reason: Error) => setError(reason.message))
  }, [conversation, threadOpen, user])

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [selectedName, conversation?.messages.length])

  function openCompose(value: MessageDraft = blank, id: number | null = null) {
    setDraft(value); setEditingId(id); setStatus(''); setError(''); setMatches([]); setComposing(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      if (!user) {
        if (!saveDraft(draft)) throw new Error('Your browser could not save the draft.')
        setStatus('Demo draft saved for this browser session.')
      } else {
        if (editingId) await api<Draft>(`/drafts/${editingId}`, { method: 'PUT', body: JSON.stringify(draft) })
        else await api<Draft>('/drafts', { method: 'POST', body: JSON.stringify(draft) })
        setDrafts(await api<Draft[]>('/drafts'))
        setStatus('Draft saved to your account.')
      }
      setComposing(false)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save draft.') }
    finally { setBusy(false) }
  }

  async function sendNew() {
    if (!user) return
    if (!draft.recipient.trim() || !draft.subject.trim() || !draft.body.trim()) {
      setError('Fill in the recipient, subject, and message before sending.'); return
    }
    setBusy(true); setError('')
    try {
      const sent = await api<Message>('/messages', { method: 'POST', body: JSON.stringify(draft) })
      if (editingId) await api<void>(`/drafts/${editingId}`, { method: 'DELETE' })
      setDrafts((old) => old.filter((item) => item.id !== editingId))
      setMessages((old) => [...old, sent])
      setActivePeer(sent.recipient); setShowDrafts(false); setComposing(false); setStatus('Message sent.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not send message.') }
    finally { setBusy(false) }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !conversation || !reply.trim()) return
    setBusy(true); setError('')
    try {
      const sent = await api<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify({ recipient: conversation.name, subject: `Re: ${conversation.latest.subject.replace(/^Re: /i, '')}`, body: reply.trim() }),
      })
      setMessages((old) => [...old, sent]); setReply(''); setStatus('Message sent.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not send message.') }
    finally { setBusy(false) }
  }

  async function deleteDraft(id: number) {
    try {
      await api<void>(`/drafts/${id}`, { method: 'DELETE' })
      setDrafts((old) => old.filter((item) => item.id !== id))
      setStatus('Draft deleted.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete draft.') }
  }

  return <div className="inbox-page">
    <div className="section-heading inbox-heading"><div><span className="eyebrow">BETTER, TOGETHER</span><h1>Messages</h1></div><button className="icon-button" aria-label="New message" onClick={() => openCompose(user ? blank : readDraft())}><Plus /></button></div>
    {status && <p className="status-message" role="status">{status}</p>}
    {error && !composing && <p className="form-error" role="alert">{error}</p>}
    <div className={`messenger ${threadOpen && !showDrafts ? 'messenger--thread-open' : ''}`}>
      <aside className="messenger-sidebar" aria-label="Conversations">
        <div className="messenger-sidebar-top"><h2>Conversations</h2>{user && <button className={`draft-toggle ${showDrafts ? 'is-active' : ''}`} onClick={() => { setShowDrafts(!showDrafts); setActivePeer(null) }}>Drafts{drafts.length > 0 ? ` (${drafts.length})` : ''}</button>}</div>
        {showDrafts && user ? <div className="conversation-rows">{drafts.length ? drafts.map((item) => <div className="conversation-row conversation-draft" key={item.id}><span className="avatar">D</span><span className="conversation-summary"><strong>{item.recipient || 'No recipient'}</strong><span>{item.body || item.subject || 'Empty draft'}</span></span><span className="draft-actions"><button onClick={() => openCompose(item, item.id)}>Edit</button><button onClick={() => deleteDraft(item.id)}>Delete</button></span></div>) : <p className="conversation-empty">No saved drafts.</p>}</div>
          : <div className="conversation-rows">{conversations.length ? conversations.map((item) => <button key={item.name.toLowerCase()} className={`conversation-row ${selectedName?.toLowerCase() === item.name.toLowerCase() ? 'is-active' : ''}`} aria-pressed={selectedName?.toLowerCase() === item.name.toLowerCase()} onClick={() => { setActivePeer(item.name); setShowDrafts(false); setStatus('') }}><span className="avatar">{item.name.slice(0, 2).toUpperCase()}</span><span className="conversation-summary"><strong>{item.name}</strong><span>{item.latest.sender.toLowerCase() === user?.username.toLowerCase() ? 'You: ' : ''}{item.latest.body}</span></span><span className="conversation-meta"><time dateTime={item.latest.date}>{formatDay(item.latest.date)}</time>{item.unread > 0 && <span className="unread-count" aria-label={`${item.unread} unread messages`}>{item.unread}</span>}</span></button>) : <p className="conversation-empty">No conversations yet. Start one with another learner.</p>}</div>}
        {!user && <p className="messenger-demo-note">Sample conversations. Create an account to chat with other learners.</p>}
      </aside>
      <section className="conversation-panel" aria-label={conversation ? `Conversation with ${conversation.name}` : 'Conversation'}>
        {conversation && !showDrafts ? <>
          <header className="conversation-header"><button className="chat-back" aria-label="Back to conversations" onClick={() => setActivePeer(null)}><ArrowLeft size={21} /></button><span className="avatar">{conversation.name.slice(0, 2).toUpperCase()}</span><div><h2>{conversation.name}</h2><p>{user ? 'Your conversation' : 'Sample conversation'}</p></div></header>
          <div className="conversation-timeline">{conversation.messages.map((message, index) => {
            const outgoing = message.sender.toLowerCase() === (user?.username || 'Learner').toLowerCase()
            const previous = conversation.messages[index - 1]
            const newDay = !previous || formatDay(previous.date) !== formatDay(message.date)
            return <div key={message.id}>{newDay && <div className="conversation-day">{formatDay(message.date)}</div>}<div className={`chat-line ${outgoing ? 'chat-line--outgoing' : ''}`}><div className="chat-bubble"><span className="chat-subject">{message.subject}</span><p>{message.body}</p><time dateTime={message.date}>{formatTime(message.date)}</time></div></div></div>
          })}<div ref={bottom} /></div>
          {user ? <form className="chat-composer" onSubmit={sendReply}><label className="sr-only" htmlFor="chat-reply">Message {conversation.name}</label><textarea id="chat-reply" rows={2} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={`Message ${conversation.name}…`} maxLength={5000} /><button className="chat-send" type="submit" disabled={busy || !reply.trim()} aria-label="Send message"><Send size={21} /></button></form> : <div className="chat-demo-prompt">Sign in to send a message.</div>}
        </> : <div className="conversation-placeholder"><MessageCircle size={52} strokeWidth={1.3} /><h2>{showDrafts ? 'Your saved drafts' : 'Start a conversation'}</h2><p>{showDrafts ? 'Choose a draft to finish your message.' : 'Choose a person or write a new message.'}</p><button className="button button--dark" onClick={() => openCompose(user ? blank : readDraft())}>New message</button></div>}
      </section>
    </div>
    {composing && <Dialog title={editingId ? 'Edit draft' : 'New message'} onClose={() => setComposing(false)}><form className="compose-form" onSubmit={save}><label>To<input value={draft.recipient} onChange={(event) => { setDraft({ ...draft, recipient: event.target.value }); setMatches([]) }} placeholder="Username or email address" maxLength={100} /></label>{user && draft.recipient.trim().length >= 2 && matches.length > 0 && <div className="recipient-matches" aria-label="Matching users">{matches.map((match) => <button type="button" key={match.id} onClick={() => { setDraft({ ...draft, recipient: match.username }); setMatches([]) }}>{match.username}</button>)}</div>}<label>Subject<input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} maxLength={150} /></label><label>Your message<textarea rows={5} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} maxLength={5000} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="compose-actions"><button type="submit" className="button button--dark" disabled={busy}><Save size={18} /> Save draft</button>{user && <button type="button" className="button button--dark" disabled={busy} onClick={sendNew}><Send size={18} /> Send</button>}</div>{!user && <p className="helper-text">Sign in to message other learners.</p>}</form></Dialog>}
  </div>
}
