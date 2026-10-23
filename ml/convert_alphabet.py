"""Convert the pinned FHS Keras weights without executing upstream Python code.

Run with: backend/.venv/Scripts/python.exe ml/convert_alphabet.py
Conversion-only dependencies: h5py, numpy. Neither is needed to run the app.
"""
import json
from pathlib import Path

import h5py
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "ml/upstream/abakada_1st.hdf5"
target = ROOT / "frontend/public/models/alphabet"
target.mkdir(parents=True, exist_ok=True)
with h5py.File(source, "r") as model:
    config = json.loads(model.attrs["model_config"])
    assert config["config"]["layers"][-1]["config"]["units"] == 20
    specs, chunks = [], []
    for layer in config["config"]["layers"]:
        name = layer["config"]["name"]
        if name not in model["model_weights"]:
            continue
        group = model["model_weights"][name]
        for weight in group.attrs.get("weight_names", []):
            if isinstance(weight, bytes):
                weight = weight.decode()
            array = np.asarray(group[weight], dtype="<f4")
            specs.append({"name": weight.removesuffix(":0"), "shape": list(array.shape), "dtype": "float32"})
            chunks.append(array.tobytes())
    (target / "weights.bin").write_bytes(b"".join(chunks))
    (target / "model.json").write_text(json.dumps({
        "format": "layers-model", "generatedBy": "SenyasKo lossless HDF5 export",
        "modelTopology": {"keras_version": str(model.attrs["keras_version"]), "backend": "tensorflow", "model_config": config},
        "weightsManifest": [{"paths": ["weights.bin"], "weights": specs}],
    }), encoding="utf-8")
    print(f"Exported {len(specs)} tensors, {sum(map(len, chunks))} bytes, 20 outputs")
