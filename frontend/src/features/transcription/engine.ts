import type { Holistic, Results } from "@mediapipe/holistic";
import type { LayersModel } from "@tensorflow/tfjs";
import {
  ALPHABET,
  PHRASES,
  singleHandFeatures,
  phraseFeatures,
  selectPrediction,
  selectPhrasePrediction,
  Stabilizer,
  PhraseCapture,
} from "./recognition";
import type { Mode, PhrasePhase, Point, Prediction } from "./recognition";

type Options = {
  mode: Mode;
  threshold: number;
  onFrame: (result: Results) => void;
  onPrediction: (
    prediction: Prediction | null,
    progress: number,
    hands: boolean,
    phase: PhrasePhase | null,
  ) => void;
  onToken: (token: string) => void;
  onError: (error: Error) => void;
};
type HolisticConstructor = new (config: {
  locateFile: (file: string) => string;
}) => Holistic;
let scriptPromise: Promise<HolisticConstructor> | null = null;
function loadHolistic(): Promise<HolisticConstructor> {
  if (!scriptPromise)
    scriptPromise = new Promise<HolisticConstructor>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/mediapipe/holistic.js";
      script.onload = () => {
        const constructor = (
          window as unknown as { Holistic?: HolisticConstructor }
        ).Holistic;
        if (constructor) resolve(constructor);
        else {
          script.remove();
          reject(
            new Error(
              "The hand tracker could not load. Restart the app and try again.",
            ),
          );
        }
      };
      script.onerror = () => {
        script.remove();
        reject(
          new Error(
            "Hand tracking files are missing. Run npm run dev to prepare local assets.",
          ),
        );
      };
      document.head.append(script);
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
  return scriptPromise;
}

export class RecognitionEngine {
  private tracker: Holistic | null = null;
  private model: LayersModel | null = null;
  private tf: typeof import("@tensorflow/tfjs") | null = null;
  private stopped = false;
  private timer = 0;
  private frames: number[][] = [];
  private stable: Stabilizer;
  private phraseCapture: PhraseCapture | null;
  private count = 0;
  private lastVideoTime = -1;
  private pending: Promise<void> | null = null;
  private options: Options;
  constructor(options: Options) {
    this.options = options;
    this.stable = new Stabilizer();
    this.phraseCapture = options.mode === "phrases" ? new PhraseCapture() : null;
  }

  async initialize() {
    const tf = await import("@tensorflow/tfjs");
    this.tf = tf;
    await tf.ready();
    if (this.stopped) return;
    const model = await tf.loadLayersModel(
      `/models/${this.options.mode}/model.json`,
    );
    if (this.stopped) {
      model.dispose();
      return;
    }
    this.model = model;
    const expected =
      this.options.mode === "alphabet" ? ALPHABET.length : PHRASES.length;
    if (model.outputs[0].shape.at(-1) !== expected)
      throw new Error("Model vocabulary does not match its weights.");
    const Constructor = await loadHolistic();
    if (this.stopped) return;
    const tracker = new Constructor({
      locateFile: (file) => `/mediapipe/${file}`,
    });
    this.tracker = tracker;
    tracker.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
      selfieMode: false,
    });
    tracker.onResults((result) => {
      if (!this.stopped) this.process(result);
    });
    this.pending = tracker.initialize();
    await this.pending;
    this.pending = null;
  }

  start(video: HTMLVideoElement) {
    const tick = async () => {
      if (this.stopped || !this.tracker) return;
      const started = performance.now();
      try {
        if (video.readyState >= 2 && video.currentTime !== this.lastVideoTime) {
          this.lastVideoTime = video.currentTime;
          this.pending = this.tracker.send({ image: video });
          await this.pending;
          this.pending = null;
        }
      } catch (error) {
        if (!this.stopped)
          this.options.onError(
            error instanceof Error
              ? error
              : new Error(
                  "Recognition stopped. Restart the camera to try again.",
                ),
          );
        return;
      }
      if (!this.stopped)
        this.timer = window.setTimeout(
          tick,
          Math.max(0, 1000 / 30 - (performance.now() - started)),
        );
    };
    void tick();
  }

  private process(result: Results) {
    this.options.onFrame(result);
    const hands = Boolean(
      result.leftHandLandmarks?.length || result.rightHandLandmarks?.length,
    );
    const now = performance.now();
    if (!hands) {
      this.frames = [];
      this.count = 0;
      const capture = this.phraseCapture?.update(false, null, now);
      if (!capture) this.stable.update(null, now, true);
      this.options.onPrediction(capture?.confirmed ?? null, 0, false, capture?.phase ?? null);
      return;
    }
    const tf = this.tf!,
      model = this.model!;
    let scores: Float32Array | null = null;
    if (this.options.mode === "phrases") {
      // Same unmirrored 33-pose + left/right hand ordering as upstream.
      this.frames.push(phraseFeatures(result));
      if (this.frames.length > 30) this.frames.shift();
      this.count++;
      if (this.frames.length < 30) {
        const capture = this.phraseCapture!.update(true, null, now);
        this.options.onPrediction(capture.confirmed, this.frames.length / 30, true, capture.phase);
        return;
      }
      if (this.count % 5 !== 0) return;
      scores = tf.tidy(() =>
        (
          model.predict(
            tf.tensor3d([this.frames]),
          ) as import("@tensorflow/tfjs").Tensor
        )
          .dataSync()
          .slice(),
      ) as Float32Array;
    } else {
      // One visible hand avoids arbitrary switching between competing letters.
      if (
        result.leftHandLandmarks?.length &&
        result.rightHandLandmarks?.length
      ) {
        this.stable.update(null, now);
        this.options.onPrediction(null, 0, true, null);
        return;
      }
      const points = singleHandFeatures(result);
      if (!points) {
        this.stable.update(null, now);
        return;
      }
      scores = tf.tidy(() =>
        (
          model.predict(
            tf.tensor4d(points.flat(), [1, 21, 3, 1]),
          ) as import("@tensorflow/tfjs").Tensor
        )
          .dataSync()
          .slice(),
      ) as Float32Array;
    }
    const prediction =
      this.options.mode === "phrases"
        ? selectPhrasePrediction(scores, this.options.threshold)
        : selectPrediction(scores, ALPHABET, this.options.threshold);
    if (this.phraseCapture) {
      const capture = this.phraseCapture.update(true, prediction, now);
      if (capture.token) this.options.onToken(capture.token);
      this.options.onPrediction(capture.confirmed, 1, true, capture.phase);
    } else {
      const token = this.stable.update(prediction, now);
      if (token) this.options.onToken(token);
      this.options.onPrediction(prediction, 1, true, null);
    }
  }

  async close() {
    this.stopped = true;
    window.clearTimeout(this.timer);
    // MediaPipe must finish send/initialize before closing its WASM graph.
    try {
      await this.pending;
    } catch {
      /* cleanup must still run after failure */
    }
    const tracker = this.tracker;
    this.tracker = null;
    try {
      await tracker?.close();
    } finally {
      this.model?.dispose();
      this.model = null;
      this.frames = [];
    }
  }
}

const connections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];
export function drawHands(canvas: HTMLCanvasElement, result: Results) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const hand of [result.leftHandLandmarks, result.rightHandLandmarks]) {
    if (!hand) continue;
    const at = (p: Point) => [p.x * canvas.width, p.y * canvas.height];
    context.strokeStyle = "#83e3e1";
    context.fillStyle = "#ffffff";
    context.lineWidth = 3;
    for (const [a, b] of connections) {
      const [x, y] = at(hand[a]),
        [x2, y2] = at(hand[b]);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x2, y2);
      context.stroke();
    }
    for (const p of hand) {
      const [x, y] = at(p);
      context.beginPath();
      context.arc(x, y, 3, 0, 2 * Math.PI);
      context.fill();
    }
  }
}
