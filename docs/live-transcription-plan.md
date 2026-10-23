# Live FSL transcription

The user authorized the implementation method and asked to proceed directly. Work in the existing clean feature checkout, preserving account and messaging functionality.

## Design
Make `/` and `/transcribe` a public camera/transcript workspace. Redirect former learning routes to transcription. Keep React, Vite and the existing account API. Use local TensorFlow.js models and MediaPipe Holistic, matching upstream landmark ordering exactly. No camera frames leave the browser. Bundle inference assets, without a runtime CDN dependency.

Use the existing DM Sans / Barlow typography, a blue-white workspace (#f3f7fa), navy text (#20384a), blue controls (#285d80), and a quiet white transcript panel. The camera is the dominant element, with adjacent editable text and a visible supported-vocabulary disclosure. Mobile stacks camera and transcript.

## Tasks
1. Acquire pinned Senyas phrase model (15 classes) and FHS Abakada alphabet model (20 letter outputs; upstream trailing none label has no output). Preserve attribution and licenses. Convert alphabet HDF5 to TensorFlow.js with a reproducible script. Validate real inference and weight integrity.
2. Test and implement landmark preprocessing, rejection of missing/uncertain inputs, temporal stabilization, duplicate suppression, explicit repeat boundary, and letter/phrase text composition.
3. Implement local model loading, camera lifecycle, sequence recognition, overlay, and stop/error cleanup. Model selection is explicit: phrases or alphabet, avoiding incompatible model score comparisons.
4. Replace learning navigation with live transcription, vocabulary and locally saved transcripts. Provide editing, copy, download, speech, spaces and undo. Save only on explicit action; disclose local storage.
5. Run unit/model smoke tests, build, lint, existing API tests, and browser checks. Review runtime cleanup and unsupported-sign behavior. Document coverage and real-camera validation limits.

## Review focus
No-hand frames must never append text; label order and shape must match weights; repeated letters require release; stale startup/inference must not revive stopped sessions; model failures must remain visible and recoverable. Confidence is a model score, not an accuracy guarantee. Full FSL interpretation, unseen signs, grammar, and unrestricted conversations are outside these pretrained models' vocabulary.

## Progress
- Research: confirmed source label orders and raw coordinate preprocessing. Phrase weights CC BY-NC 4.0; alphabet repository MIT. No unrestricted FSL translator claim.
- Implementation: public transcription workspace, model pipeline, local assets, transcript tools and preserved optional account routes complete. Legacy learning routes redirect to transcription.
- Review: independent reviewer found phrase appending erased manual newlines; reproduced with a failing regression test, then fixed. Added original-HDF5 NumPy parity reference and checksum tests following review.
- Validation: 8 frontend tests, both actual model smoke checks, 5 existing backend tests and production build pass. Browser runtime harness passed actual MediaPipe/WASM processing of blank video, no-hand rejection, stop/restart and startup cancellation. Manual UI editing, save/history and clear/undo checked. Real FSL signer accuracy remains unverified.

