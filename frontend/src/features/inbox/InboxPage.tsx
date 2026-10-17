import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { inboxMessages } from '../../data/demoContent'
import { Dialog } from '../../components/ui/Dialog'
import { readDraft, saveDraft } from '../../services/previewStorage'
import type { InboxMessage } from '../../types/learning'
import './inbox.css'

const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

export function InboxPage() {
  const [selected, setSelected] = useState<InboxMessage | null>(null)
  const [read, setRead] = useState<string[]>([])
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState(readDraft)
  const [status, setStatus] = useState('')
  function save(event: FormEvent) { event.preventDefault(); if (saveDraft(draft)) { setStatus('Draft saved for this browser session. No message was sent.'); setComposing(false) } else setStatus('Your browser couldn’t save the draft. Keep this window open to retain your text.') }
  return <div className="inbox-page"><div className="section-heading"><div><span className="eyebrow">BETTER, TOGETHER</span><h1>Your inbox</h1></div><button className="icon-button" aria-label="Compose a message draft" onClick={() => { setStatus(''); setComposing(true) }}><Plus /></button></div>{status && <p className="status-message" role="status">{status}</p>}<div className="message-list">{inboxMessages.map((message) => <button className={`message-row ${message.unread && !read.includes(message.id) ? 'message-row--unread' : ''}`} key={message.id} onClick={() => { setSelected(message); setRead((previous) => [...previous, message.id]) }}><span className={`avatar avatar--${message.initials.toLowerCase()}`}>{message.initials}</span><span className="message-text"><strong>{message.sender}</strong><span className="message-subject">{message.subject}</span><span className="message-preview">{message.preview}</span></span><span className="message-meta"><time dateTime={message.date}>{formatDate(message.date)}</time>{message.unread && !read.includes(message.id) && <span className="unread-dot" aria-label="Unread" />}</span></button>)}</div><p className="inbox-note">Sample conversations to preview your learning community.</p>{selected && <Dialog title={selected.subject} onClose={() => setSelected(null)}><div className="message-detail-sender"><span className="avatar">{selected.initials}</span><div><strong>{selected.sender}</strong><p>{formatDate(selected.date)}</p></div></div><p className="message-body">{selected.body}</p><button className="button button--dark" onClick={() => { setDraft({ recipient: selected.sender, subject: `Re: ${selected.subject}`, body: '' }); setSelected(null); setComposing(true) }}>Write a reply draft</button><p className="helper-text">This is a sample conversation.</p></Dialog>}{composing && <Dialog title="A little hello" onClose={() => setComposing(false)}><form className="compose-form" onSubmit={save}><label>To<input required value={draft.recipient} onChange={(event) => setDraft({ ...draft, recipient: event.target.value })} placeholder="Name or email address" maxLength={100} /></label><label>Subject<input required value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} placeholder="What’s on your mind?" maxLength={150} /></label><label>Your message<textarea required rows={5} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Start a conversation…" maxLength={5000} /></label><button type="submit" className="button button--dark"><Save size={18} /> Save draft</button><p className="helper-text">Drafts stay in this browser session. Sending will be available when messaging is connected.</p></form></Dialog>}</div>
}
