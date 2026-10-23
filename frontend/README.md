# SenyasKo frontend

React + TypeScript + Vite, TensorFlow.js and MediaPipe Holistic. Recognition does not require Python, an API key, a cloud service, or signing in.

## Start

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:5173. `predev` copies the pinned MediaPipe runtime and model files from node_modules into public/mediapipe. Recognition weights are included in public/models. Downloads from npm are needed during installation; runtime assets are served locally, with no CDN requests. The initial tracker assets are approximately 40 MB, so startup may take a moment.

Use a current browser with WebGL, WebAssembly, and getUserMedia. Camera access requires localhost or HTTPS. Select a mode, then Start camera and allow the permission prompt. Stop/cancel releases the camera. Switching sections, hiding the tab, or leaving the page stops recognition. Preview mirroring does not change model coordinates.

- Common phrases: keep your face, shoulders and hands in view. Follow the three cues: show hands, do one sign, then wait for the confirmed phrase to be typed. Lower both hands for about half a second to reset before the next sign. A 30-frame rolling window feeds the phrase model. Processing speed depends on the device.
- Fingerspelling: use one visible hand, hold a letter, and use Space between words. Lower the hand out of view for at least 0.4 seconds before repeating a letter. Two visible hands suppress alphabet predictions.
- Predictions require the selected score threshold and a 0.15 top-two margin. Common phrases also require a stable 0.2-second result and permit one insertion per hands-in-view interval; fingerspelling requires a stable 0.6-second hold. Scores are not measured accuracy. Unsupported signs may still be misidentified.
- Copy, download, edit, undo, save and read aloud work from the transcript panel. Speech uses your browser/OS voices; Filipino voice availability varies. Saves are explicit, in localStorage, without server synchronization. Use Download for a portable copy.

Exact vocabulary, original commits, hashes, and license restrictions are in [models/NOTICE.md](public/models/NOTICE.md). The phrase model is noncommercial (CC BY-NC 4.0). There is no full-alphabet or unrestricted-FSL support claim.

## Verify

```powershell
npm.cmd test
npm.cmd run test:models
npm.cmd run lint
npm.cmd run build
```

`test:models` loads the actual packaged weights and verifies output shape, finite normalized probabilities, cleanup, and numerical parity of the converted alphabet checkpoint against an independent NumPy implementation of the original HDF5 network. The reference is synthetic and does not measure recognition accuracy.

With the development server running, open http://localhost:5173/tests/runtime.html for real MediaPipe WASM + model initialization, synthetic blank-video processing, no-hand rejection, sequential model restart, stopped-callback checks, and cancellation during startup. It never requests your camera. This development harness is not included in the production build.

Real-camera recognition quality still needs evaluation with FSL signers. Test each supported sign, left/right-handed variation, signing speed, lighting, background, transitions, and out-of-vocabulary signs. Report per-class precision/recall and false insertions per idle minute; do not treat model scores as accuracy.

## Reproduce the alphabet conversion

The original checkpoint is in ../ml/upstream/abakada_1st.hdf5. Using Python with h5py and numpy, run from the repository root:

```powershell
backend/.venv/Scripts/python.exe ml/convert_alphabet.py
backend/.venv/Scripts/python.exe ml/verify_alphabet_reference.py
```

These conversion dependencies are not runtime dependencies. The exported checkpoint is a lossless float32 copy, without retraining. Upstream alphabet metadata lists an extra `none` label that has no corresponding weight output; the integration uses the actual 20 classes.

## Production

`npm.cmd run build` prepares local tracking assets and produces dist/. Serve it on HTTPS with SPA fallback to index.html. Camera frames never go to the optional backend. The separate FastAPI service is needed only for the retained account/inbox routes.
