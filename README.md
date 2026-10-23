# SenyasKo

A live Filipino Sign Language sign-to-text application. The main workspace now opens directly to camera recognition and an editable transcript, without an account or backend requirement.

The React app is in `frontend/`. Install dependencies once, then start it:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5173 and select **Start camera**. Allow the camera, frame your upper body and hands, and select Common phrases or Fingerspelling before starting. Models and MediaPipe tracking run locally; camera frames are not uploaded. Use HTTPS outside localhost.

In Common phrases mode, follow the marker: show your hands, perform one sign, then wait for the phrase to appear in the transcript. Lower both hands briefly to reset before signing the next phrase.

Supported pretrained vocabulary:
- Common phrases: ako, bakit, hi, hindi, ikaw, kamusta, maganda, magandang umaga, oo, salamat. The model also has letter outputs, but the app suppresses them in this mode to prevent false letters after a phrase.
- Fingerspelling: A, B, K, D, E, G, H, I, L, M, N, NG, O, P, R, S, T, U, W, Y. Use Space between words; lower your hand before repeating a letter.

The transcript supports typing corrections, undo, line breaks, copy, TXT download, browser speech, and explicit local saves. Saved transcripts remain on that browser/device. Existing accounts and messaging remain available on their routes; they require the optional [FastAPI backend](backend/README.md).

**Limits:** this is experimental fixed-vocabulary recognition, not unrestricted FSL interpretation. It has not been validated with a held-out FSL signer evaluation. Unsupported signs can produce incorrect confident predictions. The phrase weights use CC BY-NC 4.0 (noncommercial); alphabet weights use MIT. See [model provenance and licenses](frontend/public/models/NOTICE.md) and [frontend setup/tests](frontend/README.md).
