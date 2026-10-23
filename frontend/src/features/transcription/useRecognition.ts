import { useCallback, useEffect, useRef, useState } from "react";
import { RecognitionEngine, drawHands } from "./engine";
import type { Mode, PhrasePhase, Prediction } from "./recognition";

export function useRecognition(
  mode: Mode,
  threshold: number,
  onToken: (token: string) => void,
) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const engine = useRef<RecognitionEngine | null>(null);
  const generation = useRef(0);
  const cleanup = useRef<Promise<void>>(Promise.resolve());
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  const [status, setStatus] = useState<"idle" | "loading" | "active">("idle");
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [progress, setProgress] = useState(0);
  const [hands, setHands] = useState(false);
  const [phrasePhase, setPhrasePhase] = useState<PhrasePhase>("show-hands");

  const release = useCallback(() => {
    generation.current++;
    stream.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    const previous = engine.current;
    engine.current = null;
    if (previous)
      cleanup.current = previous.close().catch(() => {
        /* already stopped */
      });
    const c = canvas.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }, []);
  const stop = useCallback(() => {
    release();
    setStatus("idle");
    setPrediction(null);
    setProgress(0);
    setHands(false);
    setPhrasePhase("show-hands");
  }, [release]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      release();
    };
  }, [release, stop]);

  async function start() {
    if (status !== "idle") return;
    const id = ++generation.current;
    setStatus("loading");
    setError("");
    try {
      await cleanup.current;
      if (id !== generation.current) return;
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera access needs HTTPS or localhost and a browser with camera support.",
        );
      const next = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      });
      if (id !== generation.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = next;
      next.getVideoTracks()[0].onended = () => {
        stop();
        setError("Your camera disconnected. Reconnect it, then start again.");
      };
      const element = video.current!;
      element.srcObject = next;
      await element.play();
      if (id !== generation.current) return;
      const recognition = new RecognitionEngine({
        mode,
        threshold,
        onFrame: (result) => {
          if (canvas.current && id === generation.current) {
            canvas.current.width = element.videoWidth;
            canvas.current.height = element.videoHeight;
            drawHands(canvas.current, result);
          }
        },
        onPrediction: (value, fraction, visible, phase) => {
          if (id === generation.current) {
            setPrediction(value);
            setProgress(fraction);
            setHands(visible);
            if (phase) setPhrasePhase(phase);
          }
        },
        onToken: (token) => {
          if (id === generation.current) callback.current(token);
        },
        onError: (reason) => {
          if (id === generation.current) {
            stop();
            setError(reason.message);
          }
        },
      });
      engine.current = recognition;
      await recognition.initialize();
      if (id !== generation.current) return;
      setStatus("active");
      recognition.start(element);
    } catch (reason) {
      if (id !== generation.current) return;
      stop();
      if (reason instanceof DOMException && reason.name === "NotAllowedError")
        setError(
          "Camera permission was declined. Allow camera access in your browser, then start again.",
        );
      else if (
        reason instanceof DOMException &&
        reason.name === "NotFoundError"
      )
        setError("No camera found. Connect a camera, then start again.");
      else if (
        reason instanceof DOMException &&
        reason.name === "NotReadableError"
      )
        setError(
          "Camera is busy. Close other apps using it, then start again.",
        );
      else
        setError(
          reason instanceof Error
            ? reason.message
            : "Recognition could not start. Reload the page and try again.",
        );
    }
  }
  return {
    videoRef: video,
    canvasRef: canvas,
    status,
    error,
    prediction,
    progress,
    hands,
    phrasePhase,
    start,
    stop,
  };
}
