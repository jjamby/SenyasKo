import { RecognitionEngine } from "../src/features/transcription/engine";
import * as tf from "@tensorflow/tfjs";
const report = document.querySelector("#results")!;
const results: string[] = [];
const log = (text: string) => {
  results.push(text);
  report.textContent = results.join("\n");
};
async function run() {
  const source = document.createElement("canvas");
  source.width = 640;
  source.height = 480;
  const context = source.getContext("2d")!;
  context.fillStyle = "#666";
  context.fillRect(0, 0, 640, 480);
  const stream = source.captureStream(30);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  document.body.append(video);
  await video.play();
  const redraw = window.setInterval(() => {
    context.fillRect(0, 0, 640, 480);
  }, 30);
  try {
    for (const mode of ["alphabet", "phrases"] as const) {
      const model = await tf.loadLayersModel(`/models/${mode}/model.json`);
      const input = tf.fill(
        mode === "alphabet" ? [1, 21, 3, 1] : [1, 30, 258],
        0.2,
      );
      const inferenceStart = performance.now();
      const output = model.predict(input) as tf.Tensor;
      const probabilities = await output.data();
      if (!Array.from(probabilities).every(Number.isFinite))
        throw new Error("Invalid browser inference output");
      log(
        `${mode}: real ${tf.getBackend()} inference returned ${probabilities.length} finite scores in ${Math.round(performance.now() - inferenceStart)}ms (synthetic input)`,
      );
      input.dispose();
      output.dispose();
      model.dispose();
      let count = 0,
        tokens = 0;
      let resolveFrames!: () => void, rejectFrames!: (error: Error) => void;
      const frames = new Promise<void>((resolve, reject) => {
        resolveFrames = resolve;
        rejectFrames = reject;
      });
      const engine = new RecognitionEngine({
        mode,
        threshold: 0.85,
        onFrame: () => {
          count++;
          if (count === 12) resolveFrames();
        },
        onPrediction: () => {},
        onToken: () => {
          tokens++;
        },
        onError: rejectFrames,
      });
      const timeout = window.setTimeout(
        () => rejectFrames(new Error(`${mode}: frames timed out`)),
        45000,
      );
      try {
        await engine.initialize();
        log(`${mode}: models + WASM initialized`);
        engine.start(video);
        await frames;
        if (tokens) throw new Error("Blank input generated text");
        log(`${mode}: ${count} blank frames; zero transcript tokens`);
      } finally {
        clearTimeout(timeout);
        await engine.close();
      }
      const stoppedCount = count;
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (count !== stoppedCount)
        throw new Error("Frames continued after close");
      log(`${mode}: resources closed; no callbacks after stop`);
    }
    const cancelled = new RecognitionEngine({
      mode: "alphabet",
      threshold: 0.85,
      onFrame: () => {
        throw new Error("Cancelled engine ran");
      },
      onPrediction: () => {},
      onToken: () => {},
      onError: (error) => {
        throw error;
      },
    });
    const startup = cancelled.initialize();
    await cancelled.close();
    await startup;
    log("Cancellation during initialization: passed");
    log(
      "PASS: real local models, real MediaPipe WASM, blank-frame rejection, stop/restart, cancellation. Real-sign accuracy remains unverified.",
    );
  } finally {
    clearInterval(redraw);
    stream.getTracks().forEach((t) => t.stop());
    video.remove();
  }
}
run().catch((error) => log(`FAIL: ${error.stack || error.message}`));
