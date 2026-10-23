export type Mode = "phrases" | "alphabet";
export type Point = { x: number; y: number; z: number; visibility?: number };
export type Landmarks = {
  poseLandmarks?: Point[];
  leftHandLandmarks?: Point[];
  rightHandLandmarks?: Point[];
};
export type Prediction = { label: string; score: number };
// Output order verified against upstream test_live.py and labels_abakada2.txt.
// The alphabet checkpoint has 20 outputs: the trailing 'none' in its label file
// has no corresponding output and MUST NOT be included.
export const PHRASES = [
  "ako",
  "bakit",
  "F",
  "hi",
  "hindi",
  "ikaw",
  "kamusta",
  "L",
  "maganda",
  "magandang umaga",
  "N",
  "O",
  "oo",
  "P",
  "salamat",
];
export const PHRASE_WORDS = PHRASES.filter(
  (label) => label.length > 1 || label === "hi",
);
export const ALPHABET = [
  "A",
  "B",
  "K",
  "D",
  "E",
  "G",
  "H",
  "I",
  "L",
  "M",
  "N",
  "NG",
  "O",
  "P",
  "R",
  "S",
  "T",
  "U",
  "W",
  "Y",
];

export function phraseFeatures(result: Landmarks): number[] {
  const flatten = (
    points: Point[] | undefined,
    count: number,
    visibility = false,
  ) =>
    Array.from({ length: count }, (_, i) => {
      const p = points?.[i];
      return p
        ? [p.x, p.y, p.z, ...(visibility ? [p.visibility ?? 0] : [])]
        : Array(visibility ? 4 : 3).fill(0);
    }).flat();
  return [
    ...flatten(result.poseLandmarks, 33, true),
    ...flatten(result.leftHandLandmarks, 21),
    ...flatten(result.rightHandLandmarks, 21),
  ];
}
export function alphabetFeatures(points: Point[]): number[][] | null {
  if (
    points.length !== 21 ||
    points.some((p) => ![p.x, p.y, p.z].every(Number.isFinite))
  )
    return null;
  return points.map((p) => [p.x, p.y, p.z]);
}
export function singleHandFeatures(result: Landmarks): number[][] | null {
  if (result.leftHandLandmarks?.length && result.rightHandLandmarks?.length)
    return null;
  return alphabetFeatures(
    result.rightHandLandmarks?.length
      ? result.rightHandLandmarks
      : (result.leftHandLandmarks ?? []),
  );
}
export function selectPrediction(
  scores: ArrayLike<number>,
  labels: string[],
  threshold: number,
): Prediction | null {
  if (
    scores.length !== labels.length ||
    !Array.from(scores).every(Number.isFinite)
  )
    return null;
  const ranked = Array.from(scores, (score, index) => ({
    score,
    label: labels[index],
  })).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  return top &&
    top.score >= threshold &&
    top.score - (ranked[1]?.score ?? 0) >= 0.15 &&
    top.label.toLowerCase() !== "none"
    ? top
    : null;
}
export function selectPhrasePrediction(
  scores: ArrayLike<number>,
  threshold: number,
): Prediction | null {
  const result = selectPrediction(scores, PHRASES, threshold);
  return result && PHRASE_WORDS.includes(result.label) ? result : null;
}
export class Stabilizer {
  private candidate = "";
  private since = 0;
  private last = "";
  private releaseSince: number | null = null;
  private hold: number;
  private release: number;
  private lockUntilGap: boolean;
  constructor(hold = 600, release = 400, lockUntilGap = false) {
    this.hold = hold;
    this.release = release;
    this.lockUntilGap = lockUntilGap;
  }
  get acceptedLabel() {
    return this.last;
  }
  reset() {
    this.candidate = "";
    this.last = "";
    this.since = 0;
    this.releaseSince = null;
  }
  update(
    prediction: Prediction | null,
    time: number,
    noHands = false,
  ): string | null {
    if (this.lockUntilGap && this.last && prediction?.label !== this.last) {
      this.releaseSince ??= time;
      if (time - this.releaseSince >= this.release) {
        this.last = "";
        this.releaseSince = null;
      } else {
        this.candidate = "";
        return null;
      }
    }
    if (noHands) {
      this.releaseSince ??= time;
      if (time - this.releaseSince >= this.release) this.last = "";
    } else this.releaseSince = null;
    if (!prediction) {
      this.candidate = "";
      return null;
    }
    if (this.candidate !== prediction.label) {
      this.candidate = prediction.label;
      this.since = time;
      return null;
    }
    if (time - this.since < this.hold || this.last === prediction.label)
      return null;
    this.last = prediction.label;
    return prediction.label;
  }
}
export type PhrasePhase = "show-hands" | "signing" | "captured";
export class PhraseCapture {
  private stable = new Stabilizer(200);
  private phase: PhrasePhase = "show-hands";
  private confirmed: Prediction | null = null;
  private handsAwaySince: number | null = null;

  update(hands: boolean, prediction: Prediction | null, time: number) {
    if (!hands) {
      if (this.phase === "captured") {
        this.handsAwaySince ??= time;
        if (time - this.handsAwaySince >= 450) {
          this.phase = "show-hands";
          this.confirmed = null;
          this.stable.reset();
        }
      } else {
        this.phase = "show-hands";
        this.stable.reset();
      }
      return { phase: this.phase, token: null, confirmed: this.confirmed };
    }
    this.handsAwaySince = null;
    if (this.phase === "captured")
      return { phase: this.phase, token: null, confirmed: this.confirmed };
    this.phase = "signing";
    const token = this.stable.update(prediction, time);
    if (token && prediction) {
      this.phase = "captured";
      this.confirmed = prediction;
    }
    return { phase: this.phase, token, confirmed: this.confirmed };
  }
}
export function appendToken(text: string, label: string, mode: Mode) {
  return mode === "alphabet"
    ? text + label
    : `${text}${text && !/\s$/.test(text) ? " " : ""}${label}`;
}
