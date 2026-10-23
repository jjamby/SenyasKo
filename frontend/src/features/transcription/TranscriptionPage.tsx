import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Copy,
  Download,
  FlipHorizontal2,
  Hand,
  History,
  List,
  MicOff,
  Save,
  ScanLine,
  Trash2,
  Undo2,
  Volume2,
  X,
} from "lucide-react";
import { ALPHABET, PHRASE_WORDS, appendToken } from "./recognition";
import type { Mode } from "./recognition";
import { useRecognition } from "./useRecognition";
import "./transcription.css";

type Saved = { id: string; text: string; date: string };
const STORAGE = "senyasko.transcripts.v1";
const meanings: Record<string, string> = {
  ako: "I / me",
  bakit: "Why",
  hi: "Hello",
  hindi: "No / not",
  ikaw: "You",
  kamusta: "How are you?",
  maganda: "Beautiful",
  "magandang umaga": "Good morning",
  oo: "Yes",
  salamat: "Thank you",
};
function readSaved(): { items: Saved[]; available: boolean } {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    if (
      !Array.isArray(data) ||
      data.some(
        (x) =>
          !x ||
          typeof x.id !== "string" ||
          typeof x.text !== "string" ||
          typeof x.date !== "string",
      )
    )
      return { items: [], available: false };
    return { items: data, available: true };
  } catch {
    return { items: [], available: false };
  }
}

export function TranscriptionPage() {
  const [tab, setTab] = useState<"live" | "vocabulary" | "saved">("live");
  const [mode, setMode] = useState<Mode>("phrases");
  const [threshold, setThreshold] = useState(0.85);
  const [mirrored, setMirrored] = useState(true);
  const [text, setText] = useState("");
  const [initialSaved] = useState(readSaved);
  const [notice, setNotice] = useState(
    initialSaved.available
      ? ""
      : "Saved transcripts could not be read. You can still download the current transcript.",
  );
  const [saved, setSaved] = useState<Saved[]>(initialSaved.items);
  const storageReady = initialSaved.available;
  const [canUndo, setCanUndo] = useState(false);
  const undo = useRef<string[]>([]);
  const current = useRef("");
  function change(next: string) {
    undo.current = [...undo.current.slice(-99), current.current];
    setCanUndo(true);
    current.current = next;
    setText(next);
  }
  const { videoRef, canvasRef, ...camera } = useRecognition(
    mode,
    threshold,
    (token) => change(appendToken(current.current, token, mode)),
  );
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );
  function navigate(next: typeof tab) {
    camera.stop();
    setTab(next);
    setNotice("");
  }
  function persist(next: Saved[]) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setSaved(next);
      return true;
    } catch {
      setNotice(
        "Browser storage is unavailable or full. Download your transcript instead.",
      );
      return false;
    }
  }
  function save() {
    if (!text.trim()) return;
    if (
      persist([
        { id: crypto.randomUUID(), text, date: new Date().toISOString() },
        ...saved,
      ])
    )
      setNotice("Transcript saved in this browser.");
  }
  function download(value: string) {
    const url = URL.createObjectURL(
      new Blob([value], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `SenyasKo-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Transcript downloaded.");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Transcript copied.");
    } catch {
      setNotice(
        "Clipboard access is unavailable. Select the transcript text and copy it manually.",
      );
    }
  }
  function speak() {
    if (!window.speechSynthesis) {
      setNotice("Text-to-speech is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "fil-PH";
    speech.onerror = () =>
      setNotice(
        "Speech playback is unavailable. Try a browser with a Filipino voice installed.",
      );
    window.speechSynthesis.speak(speech);
  }
  const active = camera.status === "active",
    loading = camera.status === "loading";
  return (
    <div className="transcriber">
      <a className="skip-link" href="#transcription-main">
        Skip to content
      </a>
      <header className="transcriber-header">
        <a href="/" className="transcriber-brand">
          <span>
            <Hand size={25} />
          </span>
          SenyasKo<span className="brand-caption">Signs into words</span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              { id: "live", label: "Live transcript", icon: ScanLine },
              { id: "vocabulary", label: "Supported signs", icon: List },
              { id: "saved", label: "Saved transcripts", icon: History },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>
      <main id="transcription-main" className="transcriber-main">
        {tab === "live" && (
          <>
            <div className="transcriber-heading">
              <div>
                <h1>A space to be understood.</h1>
                <p>Turn supported Filipino signs into text, as you sign.</p>
              </div>
              <span className="privacy-pill">
                <MicOff size={16} /> No audio or video uploads
              </span>
            </div>
            <div className="transcriber-grid">
              <section
                className="capture-panel"
                aria-label="Camera and recognition"
              >
                <div className="capture-toolbar">
                  <div className="mode-switch" aria-label="Recognition mode">
                    <button
                      disabled={active || loading}
                      aria-pressed={mode === "phrases"}
                      onClick={() => setMode("phrases")}
                    >
                      Common phrases
                    </button>
                    <button
                      disabled={active || loading}
                      aria-pressed={mode === "alphabet"}
                      onClick={() => setMode("alphabet")}
                    >
                      Fingerspelling
                    </button>
                  </div>
                  <span className={`capture-state ${active ? "is-live" : ""}`}>
                    <i />
                    {loading
                      ? "Preparing…"
                      : active
                        ? "Camera on"
                        : "Camera off"}
                  </span>
                </div>
                <div
                  className={`capture-view ${mirrored ? "mirror-preview" : ""}`}
                >
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    aria-label="Live camera preview"
                  />
                  <canvas ref={canvasRef} aria-hidden="true" />
                  {!active && (
                    <div className="capture-placeholder">
                      <div className="hand-outline">
                        <Hand size={70} strokeWidth={1} />
                        <span />
                      </div>
                      <h2>
                        {loading
                          ? "Getting ready to read your signs"
                          : "Your hands. Your words."}
                      </h2>
                      <p>
                        {loading
                          ? "Loading recognition models on your device. The first start can take a moment."
                          : "Keep your face, shoulders and hands in view. Use good lighting and a clear background."}
                      </p>
                      {!loading && (
                        <button
                          className="transcribe-button primary"
                          onClick={camera.start}
                        >
                          <Camera size={19} />
                          Start camera
                        </button>
                      )}
                    </div>
                  )}
                  {active && (
                    <div className="prediction-caption" aria-live="polite">
                      <span>
                        {mode === "phrases"
                          ? camera.phrasePhase === "captured"
                            ? "Phrase added · lower your hands to reset"
                            : camera.phrasePhase === "signing"
                              ? camera.progress < 1
                                ? "Show your sign · reading movement…"
                                : "Show your sign · hold until confirmed"
                              : "Step 1 · show your hands"
                          : camera.prediction
                            ? "Recognizing"
                            : camera.hands
                            ? camera.progress < 1
                              ? "Reading movement…"
                              : "Hold a supported sign"
                            : "Bring your hands into view"}
                      </span>
                      {camera.prediction && (
                        <strong>
                          {camera.prediction.label}
                          <small>
                            {Math.round(camera.prediction.score * 100)}% model
                            score
                          </small>
                        </strong>
                      )}
                    </div>
                  )}
                </div>
                {mode === "phrases" && (
                  <div className="phrase-steps" aria-label="Phrase capture steps">
                    <span className={camera.hands || camera.phrasePhase !== "show-hands" ? "complete" : active ? "current" : ""}>
                      <b>1</b> Show hands
                    </span>
                    <span className={camera.phrasePhase === "captured" ? "complete" : camera.phrasePhase === "signing" ? "current" : ""}>
                      <b>2</b> Do one sign
                    </span>
                    <span className={camera.phrasePhase === "captured" ? "current" : ""}>
                      <b>3</b> Phrase typed
                    </span>
                  </div>
                )}
                <div className="capture-actions">
                  <button
                    className={`transcribe-button ${active || loading ? "stop" : "primary"}`}
                    onClick={active || loading ? camera.stop : camera.start}
                  >
                    {active || loading ? (
                      <CameraOff size={18} />
                    ) : (
                      <Camera size={18} />
                    )}
                    {loading
                      ? "Cancel startup"
                      : active
                        ? "Stop camera"
                        : "Start camera"}
                  </button>
                  <button
                    className="transcribe-button quiet"
                    aria-pressed={mirrored}
                    onClick={() => setMirrored(!mirrored)}
                  >
                    <FlipHorizontal2 size={18} />
                    Mirror preview
                  </button>
                </div>
                {camera.error && (
                  <p className="transcriber-error" role="alert">
                    {camera.error}
                  </p>
                )}
                <div className="capture-guidance">
                  <strong>
                    {mode === "phrases"
                      ? "One sign per capture."
                      : "Show one hand and hold each letter."}
                  </strong>
                  <p>
                    {mode === "phrases"
                      ? "Show your hands, perform one sign, and wait for its phrase to appear in the transcript. Lower both hands briefly before the next sign. Keep your upper body visible."
                      : "Letters join into a word. Use Space between words. Lower your hand briefly before repeating the same letter."}
                  </p>
                </div>
                <details className="recognition-settings">
                  <summary>Recognition settings</summary>
                  <label htmlFor="confidence">
                    Minimum model score{" "}
                    <strong>{Math.round(threshold * 100)}%</strong>
                  </label>
                  <input
                    id="confidence"
                    type="range"
                    min="70"
                    max="98"
                    step="1"
                    disabled={active || loading}
                    value={threshold * 100}
                    onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                  />
                  <p>
                    Higher scores reject more uncertain predictions. Stop the
                    camera to change settings. Scores are not a guarantee of
                    accuracy.
                  </p>
                </details>
              </section>
              <section
                className="transcript-panel"
                aria-labelledby="transcript-title"
              >
                <div className="transcript-title">
                  <h2 id="transcript-title">Your transcript</h2>
                  <span>
                    {text.trim() ? text.trim().split(/\s+/).length : 0} words
                  </span>
                </div>
                <p className="transcript-subtitle">
                  Review and edit as you go.
                </p>
                <label className="sr-only" htmlFor="transcript-text">
                  Editable transcript
                </label>
                <textarea
                  id="transcript-text"
                  value={text}
                  onChange={(e) => change(e.target.value)}
                  placeholder="Your signs will appear here. You can also type to add or correct words."
                  spellCheck
                />
                <div className="text-edit-actions">
                  <button onClick={() => change(current.current + " ")}>
                    Space
                  </button>
                  <button
                    disabled={!text}
                    onClick={() => change(current.current + "\n")}
                  >
                    New line
                  </button>
                  <button
                    disabled={!canUndo}
                    onClick={() => {
                      const previous = undo.current.pop();
                      setCanUndo(undo.current.length > 0);
                      setNotice("");
                      if (previous !== undefined) {
                        current.current = previous;
                        setText(previous);
                      }
                    }}
                  >
                    <Undo2 size={15} />
                    Undo
                  </button>
                  <button
                    disabled={!text}
                    onClick={() => {
                      change("");
                      setNotice("Transcript cleared. Use Undo to restore it.");
                    }}
                  >
                    <X size={15} />
                    Clear
                  </button>
                </div>
                <div className="transcript-tools">
                  <button disabled={!text.trim()} onClick={copy}>
                    <Copy size={18} />
                    Copy
                  </button>
                  <button
                    disabled={!text.trim()}
                    onClick={() => download(text)}
                  >
                    <Download size={18} />
                    Download
                  </button>
                  <button disabled={!text.trim()} onClick={speak}>
                    <Volume2 size={18} />
                    Read aloud
                  </button>
                  <button
                    disabled={!text.trim() || !storageReady}
                    onClick={save}
                  >
                    <Save size={18} />
                    Save
                  </button>
                </div>
                <p className="local-save-note">
                  Saved transcripts stay in this browser. Camera video is never
                  saved.
                </p>
              </section>
            </div>
            <aside className="coverage-note">
              <Hand size={22} />
              <div>
                <strong>Built for a specific set of signs.</strong>
                <p>
                  {mode === "phrases"
                    ? "10 common words and phrases. Letter predictions are suppressed in this mode."
                    : "20 Abakada letters, including NG. C, F, J, Q, V, X and Z are not in this alphabet model."}{" "}
                  This is experimental recognition, not full FSL interpretation.
                  Unsupported signs can be misidentified; review the text.
                </p>
              </div>
              <button onClick={() => navigate("vocabulary")}>
                See supported signs
              </button>
            </aside>
          </>
        )}
        {tab === "vocabulary" && (
          <section className="vocabulary-page">
            <div className="transcriber-heading">
              <div>
                <h1>Know what can be recognized.</h1>
                <p>
                  The exact vocabulary included in the two pretrained models.
                </p>
              </div>
            </div>
            <h2>Common phrases</h2>
            <p>
              Use Common phrases mode. Keep your upper body visible and sign
              naturally, one phrase at a time.
            </p>
            <div className="vocabulary-list">
              {PHRASE_WORDS.map((label) => (
                <div key={label}>
                  <strong>{label}</strong>
                  <span>{meanings[label] || `Letter ${label}`}</span>
                </div>
              ))}
            </div>
            <h2>Fingerspelling</h2>
            <p>
              Use Fingerspelling mode with one visible hand. Pause with your
              hand out of view to repeat a letter.
            </p>
            <div className="alphabet-list">
              {ALPHABET.map((letter) => (
                <span key={letter}>{letter}</span>
              ))}
            </div>
            <div className="model-disclosure">
              <h2>About recognition</h2>
              <p>
                These are fixed-vocabulary research models. They do not
                interpret unrestricted conversations, facial grammar, or signs
                outside the lists above. There is no verified accuracy score for
                SenyasKo yet. A confident prediction can still be wrong.
              </p>
              <p>
                Phrase recognition uses{" "}
                <a
                  href="https://github.com/antoineross/Senyas-FSL-Translator"
                  target="_blank"
                  rel="noreferrer"
                >
                  Senyas FSL Translator
                </a>{" "}
                (CC BY-NC 4.0, noncommercial use). Fingerspelling uses{" "}
                <a
                  href="https://github.com/ACEKaito1412/Filipino-Hand-Sign-Recognition"
                  target="_blank"
                  rel="noreferrer"
                >
                  Filipino Hand Sign Recognition
                </a>{" "}
                (MIT). Hand and body tracking uses Google MediaPipe. All
                inference runs in your browser.
              </p>
            </div>
          </section>
        )}
        {tab === "saved" && (
          <section className="saved-page">
            <div className="transcriber-heading">
              <div>
                <h1>Words to come back to.</h1>
                <p>Transcripts you chose to save on this browser and device.</p>
              </div>
            </div>
            {saved.length === 0 ? (
              <div className="saved-empty">
                <History size={40} />
                <h2>No saved transcripts yet.</h2>
                <p>Start a transcript, then select Save to keep it here.</p>
                <button
                  className="transcribe-button primary"
                  onClick={() => navigate("live")}
                >
                  Open live transcript
                </button>
              </div>
            ) : (
              <div className="saved-list">
                {saved.map((item) => (
                  <article key={item.id}>
                    <time>{new Date(item.date).toLocaleString()}</time>
                    <p>{item.text}</p>
                    <div>
                      <button
                        onClick={() => {
                          change(item.text);
                          navigate("live");
                        }}
                      >
                        Open for editing
                      </button>
                      <button onClick={() => download(item.text)}>
                        <Download size={16} />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          if (persist(saved.filter((x) => x.id !== item.id)))
                            setNotice("Saved transcript deleted.");
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {notice && (
          <div role="status" className="transcriber-notice">
            {notice}
            <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
      </main>
      <footer className="transcriber-footer">
        <span>SenyasKo · Filipino Sign Language recognition</span>
        <span>On-device processing · Review before sharing</span>
      </footer>
    </div>
  );
}
