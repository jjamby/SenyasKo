"""Independent NumPy forward pass of original HDF5 for conversion parity.

This synthetic fixture validates conversion, NOT real-sign recognition accuracy.
"""
import json
from pathlib import Path
import h5py
import numpy as np

root = Path(__file__).resolve().parents[1]
points = np.random.default_rng(42).uniform(-0.1, 0.9, (21, 3)).astype(np.float32)
with h5py.File(root / "ml/upstream/abakada_1st.hdf5", "r") as model:
    weights = model["model_weights"]
    def weight(layer, name):
        return np.array(weights[layer][layer][name + ":0"])
    kernel = weight("conv2d_11", "kernel")[:, :, 0, :]
    bias = weight("conv2d_11", "bias")
    convolved = np.maximum(np.stack([np.einsum("ij,ijk->k", points[i:i+3], kernel) + bias for i in range(19)]), 0)
    pooled = np.stack([convolved[i:i+2].max(axis=0) for i in range(0, 18, 2)]).flatten()
    hidden = np.maximum(pooled @ weight("dense_18", "kernel") + weight("dense_18", "bias"), 0)
    hidden = np.maximum(hidden @ weight("dense_19", "kernel") + weight("dense_19", "bias"), 0)
    logits = hidden @ weight("dense_20", "kernel") + weight("dense_20", "bias")
    scores = np.exp(logits-logits.max()); scores /= scores.sum()
    path = root / "frontend/tests/alphabet-reference.json"
    path.write_text(json.dumps({"purpose":"Synthetic numerical conversion parity only", "input":points.tolist(), "scores":scores.tolist()}), encoding="utf-8")
    print("Wrote independent original-weight reference:", path)
