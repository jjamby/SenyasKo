import * as tf from "@tensorflow/tfjs";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const hashes = {
  "phrases/model.json":
    "5a810c4f474911a77030b58dcd3f205089f57e9907c54c05dea1d08e5abe4842",
  "phrases/group1-shard1of1.bin":
    "c62e7dff2f5a4fc1c8390e1816c9d551eac5714b5bfc8ce36aaa14f60ad34abe",
  "alphabet/model.json":
    "2b8f3f35bbac0774b81b7fa5a48b615a6899da157db6e409231ab96aa55a50c3",
  "alphabet/weights.bin":
    "2887e45d8f2335a9cf4d7c4e4be845f3540876ec54749865d051e123e551347d",
};
for (const [file, expected] of Object.entries(hashes)) {
  assert.equal(
    createHash("sha256")
      .update(
        await readFile(new URL(`../public/models/${file}`, import.meta.url)),
      )
      .digest("hex"),
    expected,
    `Model checksum: ${file}`,
  );
}
console.log("All pinned model asset hashes match");
for (const [name, shape, outputs] of [
  ["alphabet", [1, 21, 3, 1], 20],
  ["phrases", [1, 30, 258], 15],
]) {
  const base = new URL(`../public/models/${name}/`, import.meta.url);
  const json = JSON.parse(await readFile(new URL("model.json", base)));
  const buffers = await Promise.all(
    json.weightsManifest
      .flatMap((g) => g.paths)
      .map((p) => readFile(new URL(p, base))),
  );
  const data = Buffer.concat(buffers);
  const model = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: json.modelTopology,
      weightSpecs: json.weightsManifest.flatMap((g) => g.weights),
      weightData: data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength,
      ),
    }),
  );
  const input = tf.zeros(shape);
  const result = model.predict(input);
  const values = await result.data();
  assert.equal(values.length, outputs);
  assert.ok([...values].every(Number.isFinite));
  assert.ok(Math.abs([...values].reduce((a, b) => a + b, 0) - 1) < 0.0001);
  if (name === "alphabet") {
    const reference = JSON.parse(
      await readFile(
        new URL("../tests/alphabet-reference.json", import.meta.url),
      ),
    );
    const sample = tf.tensor4d(reference.input.flat(), [1, 21, 3, 1]);
    const predicted = model.predict(sample);
    const actual = await predicted.data();
    const error = Math.max(
      ...Array.from(actual, (v, i) => Math.abs(v - reference.scores[i])),
    );
    assert.ok(error < 0.0001, `Original HDF5 parity error: ${error}`);
    sample.dispose();
    predicted.dispose();
    console.log(`alphabet: original HDF5 NumPy parity max error ${error}`);
  }
  input.dispose();
  result.dispose();
  model.dispose();
  console.log(
    `${name}: real weights loaded; ${shape} -> ${outputs} finite probabilities`,
  );
}
assert.equal(tf.memory().numTensors, 0);
