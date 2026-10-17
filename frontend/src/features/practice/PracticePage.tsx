import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Camera, CameraOff, FlipHorizontal2, Hand, ShieldCheck } from 'lucide-react'
import './practice.css'

export function PracticePage() {
  const [params] = useSearchParams()
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const requestId = useRef(0)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mirrored, setMirrored] = useState(true)
  useEffect(() => () => { requestId.current += 1; stream.current?.getTracks().forEach((track) => track.stop()) }, [])
  function stop() { requestId.current += 1; stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; if (video.current) video.current.srcObject = null; setActive(false); setLoading(false) }
  async function start() {
    setError(''); setLoading(true)
    const id = ++requestId.current
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs a supported browser on HTTPS or localhost.')
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      if (id !== requestId.current) { next.getTracks().forEach((track) => track.stop()); return }
      stream.current = next
      if (video.current) { video.current.srcObject = next; await video.current.play() }
      if (id !== requestId.current) return
      setActive(true)
    } catch (reason) {
      if (id !== requestId.current) return
      stream.current?.getTracks().forEach((track) => track.stop())
      stream.current = null
      if (reason instanceof DOMException && reason.name === 'NotAllowedError') setError('Camera permission was declined. Allow camera access in your browser, then try again.')
      else if (reason instanceof DOMException && reason.name === 'NotFoundError') setError('No camera was found. Connect a camera and try again.')
      else setError(reason instanceof Error ? reason.message : 'The camera couldn’t start. Please try again.')
    } finally { if (id === requestId.current) setLoading(false) }
  }
  return <div className="practice-page"><div className="section-heading"><div><span className="eyebrow">YOUR SPACE TO TRY</span><h1>{params.get('lesson') || 'Let your hands do the talking.'}</h1></div></div><div className="glass-card practice-card"><div className={`camera-stage ${active ? 'camera-stage--active' : ''}`}><video ref={video} muted playsInline className={mirrored ? 'is-mirrored' : ''} aria-label="Your live camera preview" />{!active && <div className="camera-placeholder"><span className="camera-symbol"><Hand size={60} strokeWidth={1.3} /></span><h2>Ready when you are.</h2><p>Find a little light and give your hands some room.</p></div>}{active && <span className="camera-live"><i /> Live preview</span>}<span className="camera-corner camera-corner--tl" /><span className="camera-corner camera-corner--tr" /><span className="camera-corner camera-corner--bl" /><span className="camera-corner camera-corner--br" /></div><div className="camera-controls"><button className="button button--dark" disabled={loading} onClick={active ? stop : start}>{active ? <CameraOff size={20} /> : <Camera size={20} />}{loading ? 'Opening camera…' : active ? 'Stop camera' : 'Enable camera'}</button><button className="icon-button" aria-label="Mirror camera preview" aria-pressed={mirrored} onClick={() => setMirrored(!mirrored)}><FlipHorizontal2 /></button></div>{error && <p className="form-error" role="alert">{error}</p>}<p className="camera-privacy"><ShieldCheck size={17} /> Camera video stays on your device.</p></div><div className="practice-note"><h2>Practice preview</h2><p>You can check your framing and camera here. Sign recognition, accuracy scores, and corrective feedback are not connected yet.</p><Link className="text-link" to="/collections">Choose a collection ↗</Link></div></div>
}
