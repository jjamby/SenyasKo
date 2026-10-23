import test from "node:test";
import assert from "node:assert/strict";
import {
  phraseFeatures,
  alphabetFeatures,
  singleHandFeatures,
  selectPrediction,
  selectPhrasePrediction,
  Stabilizer,
  PhraseCapture,
  appendToken,
  PHRASES,
  ALPHABET,
} from "./recognition.ts";

test("phrase input matches 33 xyzw pose + 21 xyz left + 21 xyz right", () => {
  const p = { x: 0.1, y: 0.2, z: 0.3, visibility: 0.9 };
  const v = phraseFeatures({
    poseLandmarks: Array(33).fill(p),
    leftHandLandmarks: Array(21).fill(p),
  });
  assert.equal(v.length, 258);
  assert.deepEqual(v.slice(0, 4), [0.1, 0.2, 0.3, 0.9]);
  assert.deepEqual(v.slice(132, 135), [0.1, 0.2, 0.3]);
  assert.ok(v.slice(195).every((x) => x === 0));
  assert.deepEqual(phraseFeatures({}), Array(258).fill(0));
});
test("alphabet preserves raw xyz coordinates and rejects incomplete hands", () => {
  assert.equal(alphabetFeatures([]), null);
  assert.deepEqual(
    alphabetFeatures(Array(21).fill({ x: 0.2, y: 0.4, z: -0.1 }))[0],
    [0.2, 0.4, -0.1],
  );
});
test("alphabet selects a visible left hand even when the right result is an empty array", () => {
  const hand = Array(21).fill({ x: 0.2, y: 0.4, z: -0.1 });
  assert.deepEqual(
    singleHandFeatures({ leftHandLandmarks: hand, rightHandLandmarks: [] }),
    alphabetFeatures(hand),
  );
  assert.deepEqual(
    singleHandFeatures({ rightHandLandmarks: hand }),
    alphabetFeatures(hand),
  );
  assert.equal(
    singleHandFeatures({ leftHandLandmarks: hand, rightHandLandmarks: hand }),
    null,
  );
  assert.equal(singleHandFeatures({}), null);
});
test("low confidence, ambiguous, invalid and none outputs are rejected", () => {
  assert.equal(selectPrediction([0.5, 0.5], ["A", "B"], 0.8), null);
  assert.equal(selectPrediction([0.8, 0.77], ["A", "B"], 0.7), null);
  assert.equal(selectPrediction([NaN, 0.9], ["A", "B"], 0.8), null);
  assert.equal(selectPrediction([0.01, 0.99], ["A", "none"], 0.8), null);
  assert.deepEqual(selectPrediction([0.95, 0.05], ["A", "B"], 0.8), {
    label: "A",
    score: 0.95,
  });
  assert.equal(PHRASES.length, 15);
  assert.equal(ALPHABET.length, 20);
});
test("common phrase mode rejects letter outputs even when P wins confidently", () => {
  const p = PHRASES.indexOf("P");
  const salamat = PHRASES.indexOf("salamat");
  const scores = Array(PHRASES.length).fill(0);
  scores[p] = 0.98;
  assert.equal(selectPhrasePrediction(scores, 0.85), null);
  scores[p] = 0;
  scores[salamat] = 0.98;
  assert.deepEqual(selectPhrasePrediction(scores, 0.85), {label:"salamat",score:0.98});
});
test("phrase result stays latched until a quiet gap, then accepts the next phrase", () => {
  const gate = new Stabilizer(200, 500, true);
  const sign = (label) => ({label,score:0.95});
  assert.equal(gate.update(sign("salamat"),0),null);
  assert.equal(gate.update(sign("salamat"),250),"salamat");
  assert.equal(gate.update(sign("P"),350),null);
  assert.equal(gate.update(sign("P"),800),null);
  assert.equal(gate.update(sign("P"),900),null);
  assert.equal(gate.update(sign("kamusta"),950),null);
  assert.equal(gate.update(sign("kamusta"),1200),"kamusta");
});
test("phrase capture shows readiness, types once, and rearms only after hands leave", () => {
  const capture = new PhraseCapture();
  const sign = (label) => ({ label, score: 0.96 });
  assert.deepEqual(capture.update(false, null, 0), { phase: "show-hands", token: null, confirmed: null });
  assert.equal(capture.update(true, null, 100).phase, "signing");
  assert.equal(capture.update(true, sign("salamat"), 300).token, null);
  assert.deepEqual(capture.update(true, sign("salamat"), 550), {
    phase: "captured", token: "salamat", confirmed: sign("salamat"),
  });
  assert.equal(capture.update(true, sign("kamusta"), 1200).token, null);
  assert.equal(capture.update(true, sign("kamusta"), 1700).confirmed.label, "salamat");
  assert.equal(capture.update(false, null, 1800).phase, "captured");
  assert.equal(capture.update(true, sign("kamusta"), 2000).phase, "captured");
  assert.equal(capture.update(false, null, 2100).phase, "captured");
  assert.equal(capture.update(false, null, 2600).phase, "show-hands");
  assert.equal(capture.update(true, sign("kamusta"), 2700).token, null);
  assert.equal(capture.update(true, sign("kamusta"), 2950).token, "kamusta");
});
test("stable holds emit once, noisy predictions do not unlock repeated signs", () => {
  const s = new Stabilizer(300, 250);
  const a = { label: "A", score: 0.95 };
  assert.equal(s.update(a, 0), null);
  assert.equal(s.update(a, 299), null);
  assert.equal(s.update(a, 300), "A");
  assert.equal(s.update(a, 900), null);
  s.update(null, 950);
  assert.equal(s.update(a, 1000), null);
  assert.equal(s.update(a, 1500), null);
  s.update(null, 1600, true);
  s.update(null, 1900, true);
  s.update(a, 2000);
  assert.equal(s.update(a, 2300), "A");
});
test("changed signs need a fresh hold; reset clears previous session", () => {
  const s = new Stabilizer(100, 100);
  s.update({ label: "A", score: 0.9 }, 0);
  s.update({ label: "B", score: 0.9 }, 60);
  assert.equal(s.update({ label: "B", score: 0.9 }, 120), null);
  assert.equal(s.update({ label: "B", score: 0.9 }, 160), "B");
  s.reset();
  assert.equal(s.update({ label: "B", score: 0.9 }, 200), null);
  assert.equal(s.update({ label: "B", score: 0.9 }, 300), "B");
});
test("letters form words; phrases and manual spaces preserve boundaries", () => {
  assert.equal(appendToken("SA", "L", "alphabet"), "SAL");
  assert.equal(appendToken("SALAMAT ", "P", "alphabet"), "SALAMAT P");
  assert.equal(
    appendToken("salamat", "magandang umaga", "phrases"),
    "salamat magandang umaga",
  );
  assert.equal(appendToken("salamat\n", "ako", "phrases"), "salamat\nako");
  assert.equal(appendToken("salamat  ", "ako", "phrases"), "salamat  ako");
});
