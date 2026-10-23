# Model attribution and limitations

## Senyas FSL Translator
Author: antoineross and the Senyas project contributors.
Source: https://github.com/antoineross/Senyas-FSL-Translator
Pinned revision: f659937d4f50b46e14432d67461c58cd592f46b8
Files: models/model.json and models/group1-shard1of1.bin (unmodified).
License stated by upstream README: Creative Commons Attribution–NonCommercial 4.0.
License terms: https://creativecommons.org/licenses/by-nc/4.0/legalcode
These weights may only be used for noncommercial purposes under that license.
No endorsement by upstream authors is implied.

15 outputs, in original order: ako, bakit, F, hi, hindi, ikaw, kamusta, L, maganda, magandang umaga, N, O, oo, P, salamat. The application rejects the five single-letter outputs in Common phrases mode because transitions out of a phrase can otherwise produce false letters.
Input: 30 frames × 258 raw landmark values: 33 pose landmarks (x,y,z,visibility), 21 left hand (x,y,z), 21 right hand (x,y,z). Missing landmarks are zeros. Mirror only the display, not inference coordinates. Upstream exported LSTM metadata contains a stale batch_input_shape; TensorFlow.js may log a shape warning while correctly using the preceding Conv1D output and original weights.

## Filipino Hand Sign Recognition
Author: ACEKaito1412.
Source: https://github.com/ACEKaito1412/Filipino-Hand-Sign-Recognition
Pinned revision: 1a0748d037eac353680d09511b31211a2b9b87d5
Original: Server/model/abakada_1st.hdf5.
License: MIT, full notice in alphabet/LICENSE.
Modification: lossless float32 weight export and Keras topology conversion to TensorFlow.js by ml/convert_alphabet.py; no retraining.
Input: [batch,21,3,1] raw single-hand xyz coordinates, no wrist centering or normalization.
Output labels: first 20 entries in labels_abakada2.txt, uppercased. The source label file ends in 'none', but the actual checkpoint only has 20 outputs, so it cannot predict 'none'. The alphabet omits C, F, J, Q, V, X, Z and includes NG. F exists in the phrase model weights but is currently suppressed in Common phrases mode.

## Checksums (SHA-256)
- phrases/model.json: 5a810c4f474911a77030b58dcd3f205089f57e9907c54c05dea1d08e5abe4842
- phrases/group1-shard1of1.bin: c62e7dff2f5a4fc1c8390e1816c9d551eac5714b5bfc8ce36aaa14f60ad34abe
- alphabet/model.json: 2b8f3f35bbac0774b81b7fa5a48b615a6899da157db6e409231ab96aa55a50c3
- alphabet/weights.bin: 2887e45d8f2335a9cf4d7c4e4be845f3540876ec54749865d051e123e551347d
- original abakada_1st.hdf5: 22b6cc29127b1c65948969812654ce95fab776b7216570e7cf89e66fe26094b7

Google MediaPipe Holistic 0.5.1675471629 and TensorFlow.js 4.22.0 are Apache-2.0 licensed. MediaPipe assets are copied from the pinned npm installation by scripts/prepare-assets.mjs.

## Validation scope
The local integration is not a validated interpreter. Confidence values are model scores, not calibrated accuracy. Closed-set models can confidently misclassify unsupported signs. No-hand rejection, a score threshold, a top-two margin and temporal stability reduce accidental output but do not solve open-set recognition. This project has no held-out FSL signer evaluation or verified real-world accuracy claim. Evaluate with Deaf FSL signers before relying on it for communication.
