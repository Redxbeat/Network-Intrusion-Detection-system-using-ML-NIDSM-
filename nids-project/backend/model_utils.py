"""
model_utils.py
--------------
This module loads the trained models (Random Forest, SVM, ANN)
and performs ensemble predictions for real-time intrusion detection.
"""

import os
import numpy as np
import joblib
import tensorflow as tf
from pathlib import Path


def find_model_file(base_dir: str, name: str):
    """Search common locations for a model file and return the first existing path or None.

    Search order:
    - <base_dir>/models/<name>
    - <base_dir>/../models/<name>
    - <base_dir>/../../models/<name>
    - <cwd>/models/<name>
    """
    candidates = []
    base = Path(base_dir)
    candidates.append(base / "models" / name)
    candidates.append(base.parent / "models" / name)
    candidates.append(base.parent.parent / "models" / name)
    candidates.append(Path.cwd() / "models" / name)

    # For ANN try common extensions if name has no extension
    if not Path(name).suffix:
        ann_exts = [".keras", ".h5", ""]
        expanded = []
        for c in candidates:
            for ext in ann_exts:
                expanded.append(Path(str(c) + ext))
        candidates = expanded

    for p in candidates:
        if p.exists():
            return str(p)
    # If none found, return None
    return None

# === Paths to models ===
BASE_DIR = os.path.dirname(__file__)
RF_PATH = find_model_file(BASE_DIR, "rf_model.joblib")
SVM_PATH = find_model_file(BASE_DIR, "svm_model.joblib")
# Try common ANN names/extensions
ANN_PATH = find_model_file(BASE_DIR, "ann_model") or find_model_file(BASE_DIR, "ann_model.keras") or find_model_file(BASE_DIR, "ann_model.h5")

# === Load all models ===
print("🔍 Loading trained models...")

try:
    if RF_PATH:
        rf_model = joblib.load(RF_PATH)
        print(f"✅ Random Forest model loaded from: {RF_PATH}")
    else:
        raise FileNotFoundError("RF model file not found in searched locations")
except Exception as e:
    rf_model = None
    print("⚠️ Error loading Random Forest:", e)

try:
    if SVM_PATH:
        svm_model = joblib.load(SVM_PATH)
        print(f"✅ SVM model loaded from: {SVM_PATH}")
    else:
        raise FileNotFoundError("SVM model file not found in searched locations")
except Exception as e:
    svm_model = None
    print("⚠️ Error loading SVM:", e)

try:
    if ANN_PATH:
        # load_model will accept .keras and .h5; if ANN_PATH points to a SavedModel dir it may fail under Keras 3
        try:
            ann_model = tf.keras.models.load_model(ANN_PATH)
            print(f"✅ ANN model loaded from: {ANN_PATH}")
        except Exception as sub_e:
            # Provide a helpful message with attempted path
            raise RuntimeError(f"Failed to load ANN model from {ANN_PATH}: {sub_e}")
    else:
        raise FileNotFoundError("ANN model file not found in searched locations")
except Exception as e:
    ann_model = None
    print("⚠️ Error loading ANN:", e)


def predict_ensemble(features):
    """
    Perform intrusion prediction using ensemble of RF, SVM, and ANN.
    Input:
        features (list or array): numeric feature vector
    Output:
        dict: {rf, svm, ann, score, label}
    """

    x = np.array(features).reshape(1, -1)

    rf_score = svm_score = ann_score = 0.0

    # Random Forest Prediction
    if rf_model:
        try:
            rf_score = float(rf_model.predict_proba(x)[0][1])
        except Exception as e:
            print("⚠️ RF prediction error:", e)

    # SVM Prediction
    if svm_model:
        try:
            svm_score = float(svm_model.predict_proba(x)[0][1])
        except Exception as e:
            print("⚠️ SVM prediction error:", e)

    # ANN Prediction
    if ann_model:
        try:
            ann_score = float(ann_model.predict(x, verbose=0)[0][0])
        except Exception as e:
            print("⚠️ ANN prediction error:", e)

    # === Ensemble Averaging ===
    # Weight each model differently (tuned empirically)
    final_score = 0.4 * rf_score + 0.2 * svm_score + 0.4 * ann_score
    label = int(final_score >= 0.5)

    # === Detailed Output ===
    result = {
        "rf": rf_score,
        "svm": svm_score,
        "ann": ann_score,
        "score": final_score,
        "label": label,
        "status": "Intrusion" if label == 1 else "Normal"
    }

    return result


if __name__ == "__main__":
    # Quick test
    # Derive a safe feature length from the loaded models when possible
    feature_len = None
    if rf_model is not None and hasattr(rf_model, "n_features_in_"):
        feature_len = int(rf_model.n_features_in_)
    elif svm_model is not None and hasattr(svm_model, "n_features_in_"):
        feature_len = int(svm_model.n_features_in_)
    elif ann_model is not None and hasattr(ann_model, "inputs"):
        try:
            feature_len = int(ann_model.inputs[0].shape[-1])
        except Exception:
            feature_len = None

    if feature_len is None:
        feature_len = 109  # fallback to a reasonable default based on preprocessing

    sample = [0.5] * feature_len
    output = predict_ensemble(sample)
    print("Sample prediction:", output)
