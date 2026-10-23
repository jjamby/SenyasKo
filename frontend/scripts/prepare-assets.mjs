import { mkdir, copyFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const source = new URL("../node_modules/@mediapipe/holistic/", import.meta.url);
const target = new URL("../public/mediapipe/", import.meta.url);
await mkdir(target, { recursive: true });
for (const file of await readdir(source)) {
  if (
    /\.(js|wasm|data|binarypb|tflite)$/.test(file) &&
    file !== "pose_landmark_heavy.tflite"
  ) {
    await copyFile(new URL(file, source), new URL(file, target));
  }
}
console.log("Local MediaPipe assets ready:", fileURLToPath(target));
