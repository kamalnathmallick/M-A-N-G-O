"""
Yield Regressor Training and Evaluation Pipeline

Train on a REAL numeric-yield dataset (CSV) and compare candidate scikit-learn
regressors (Random Forest, Gradient Boosting, SVR) with MAE / RMSE / R².

    .\\venv\\Scripts\\python.exe training/train_yield_regressor.py --data-csv path/to/yields.csv

Without a CSV this script REFUSES to train and exits non-zero (no more synthetic
data masquerading as a production model). For pipeline testing only, pass
--allow-synthetic: the bundle is then saved as models/yield_model_synthetic.pkl
with `synthetic: true` and is NEVER loaded by inference/fusion.py.
"""

import os
import sys
import argparse
import pickle
import datetime

# Allow `python training/train_yield_regressor.py` from ml/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd

try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.svm import SVR
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    SKLEARN_AVAILABLE = True
    IMPORT_ERROR = None
except ImportError as exc:
    SKLEARN_AVAILABLE = False
    IMPORT_ERROR = str(exc)

CONFIG_PATH = "config/model_config.yaml"
REAL_BUNDLE_PATH = "models/yield_model.pkl"
SYNTHETIC_BUNDLE_PATH = "models/yield_model_synthetic.pkl"

REFUSAL_MESSAGE = """\
[Yield Training] REFUSED: no numeric-yield dataset provided.

A yield regressor must be trained on real, measured yield data. This project does
not ship such a dataset yet, so no production model can be trained right now.

Usage:
  Real data (recommended):
      python training/train_yield_regressor.py --data-csv <path/to/yields.csv> [--target yield_tonnes_per_acre]
      The CSV must contain one row per sample with numeric feature columns (e.g. CNN
      features + climate columns) and a numeric target column (default: the `target`
      key under `yield_regressor` in config/model_config.yaml).

  Synthetic test data (pipeline check ONLY, never used by the API):
      python training/train_yield_regressor.py --allow-synthetic
      -> saves models/yield_model_synthetic.pkl with `synthetic: true`.

Exiting with a non-zero status on purpose: no model file was written.
"""


def _load_config() -> dict:
    try:
        import yaml
        if os.path.isfile(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                return yaml.safe_load(f) or {}
    except Exception:
        pass
    return {}


def _compare_models(X_train, X_test, y_train, y_test, cfg: dict):
    """Fit RF / GBR / SVR on scaled features; return (summaries, best_name, best_model)."""
    yr = cfg.get("yield_regressor", {}) or {}
    n_estimators = int(yr.get("n_estimators", 100))
    max_depth = int(yr.get("max_depth", 8))

    candidates = {
        "Random Forest": RandomForestRegressor(
            n_estimators=n_estimators, max_depth=max_depth, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=n_estimators, learning_rate=0.05, random_state=42),
        "SVR": SVR(kernel="rbf", C=1.0, epsilon=0.1),
    }

    summaries = {}
    best_name, best_model, best_rmse = None, None, float("inf")
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        r2 = float(r2_score(y_test, preds))
        summaries[name] = {"MAE": round(mae, 3), "RMSE": round(rmse, 3), "R2": round(r2, 3)}
        print(f"[{name}] MAE: {mae:.3f} | RMSE: {rmse:.3f} | R²: {r2:.3f}")
        if rmse < best_rmse:
            best_rmse, best_name, best_model = rmse, name, model
    return summaries, best_name, best_model


def train_from_csv(data_csv: str, target: str) -> int:
    """Real training mode: read a numeric-yield CSV, compare models, save the best."""
    if not SKLEARN_AVAILABLE:
        print(f"[Yield Training] scikit-learn/pandas unavailable: {IMPORT_ERROR}")
        return 1
    if not os.path.isfile(data_csv):
        print(f"[Yield Training] ERROR: CSV not found: {data_csv}")
        return 1

    df = pd.read_csv(data_csv)
    if target not in df.columns:
        print(f"[Yield Training] ERROR: target column '{target}' not found in {data_csv}.")
        print(f"  Available columns: {list(df.columns)}")
        print("  Use --target <column> to select the numeric yield column.")
        return 1

    feature_cols = [c for c in df.columns if c != target and pd.api.types.is_numeric_dtype(df[c])]
    if not feature_cols:
        print("[Yield Training] ERROR: CSV has no numeric feature columns besides the target.")
        return 1

    data = df[feature_cols + [target]].dropna()
    X = data[feature_cols].to_numpy(dtype=np.float32)
    y = data[target].to_numpy(dtype=np.float32)
    if len(data) < 10:
        print(f"[Yield Training] ERROR: only {len(data)} usable rows; need at least 10.")
        return 1

    print(f"[Yield Training] Loaded {len(data)} samples, {len(feature_cols)} features, "
          f"target='{target}'.")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    cfg = _load_config()
    summaries, best_name, best_model = _compare_models(X_train_s, X_test_s, y_train, y_test, cfg)
    print(f"\n[Best Model Selected] {best_name} "
          f"(RMSE {summaries[best_name]['RMSE']}, MAE {summaries[best_name]['MAE']}, "
          f"R² {summaries[best_name]['R2']})")

    os.makedirs("models", exist_ok=True)
    with open(REAL_BUNDLE_PATH, "wb") as f:
        pickle.dump({
            "model": best_model,
            "scaler": scaler,
            "model_name": best_name,
            "model_type": best_name.lower().replace(" ", "_"),
            "metrics": summaries[best_name],
            "all_model_metrics": summaries,
            "feature_dim": len(feature_cols),
            "feature_columns": feature_cols,
            "target": target,
            "synthetic": False,
            "trained_on": os.path.abspath(data_csv),
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }, f)
    print(f"[Model Saved] Best REAL regressor bundle saved to {REAL_BUNDLE_PATH}")
    print("[Model Saved] Inference will now report trained=true, method='regressor'.")
    return 0


def train_synthetic() -> int:
    """
    Synthetic calibration mode (explicitly requested via --allow-synthetic).
    Saved under a DIFFERENT filename and flagged synthetic so fusion never loads it.
    """
    if not SKLEARN_AVAILABLE:
        print(f"[Yield Training] scikit-learn/pandas unavailable: {IMPORT_ERROR}")
        return 1

    print("[Yield Training] --allow-synthetic passed: building SYNTHETIC test data.")
    print("[Yield Training] WARNING: this bundle is for pipeline testing only. It will be "
          "saved as yield_model_synthetic.pkl and is NEVER loaded by the API.")

    np.random.seed(42)
    n_samples = 300
    cfg = _load_config()
    feature_dim = 39  # 32 visual + 6 climate + 1 variety (legacy layout)

    X_synthetic = np.random.randn(n_samples, feature_dim).astype(np.float32)
    y_synthetic = (
        4.2
        + (X_synthetic[:, 0] * 0.2)
        + (X_synthetic[:, 32] * 0.3)
        - (X_synthetic[:, 34] * 0.4)
        + (X_synthetic[:, 38] * 0.5)
        + np.random.normal(0, 0.15, n_samples)
    ).astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(
        X_synthetic, y_synthetic, test_size=0.2, random_state=42
    )
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    summaries, best_name, best_model = _compare_models(X_train_s, X_test_s, y_train, y_test, cfg)

    os.makedirs("models", exist_ok=True)
    with open(SYNTHETIC_BUNDLE_PATH, "wb") as f:
        pickle.dump({
            "model": best_model,
            "scaler": scaler,
            "model_name": best_name,
            "model_type": best_name.lower().replace(" ", "_"),
            "metrics": summaries[best_name],
            "all_model_metrics": summaries,
            "feature_dim": feature_dim,
            "feature_columns": None,
            "target": "synthetic_yield",
            "synthetic": True,
            "trained_on": "np.random.randn synthetic data",
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }, f)
    print(f"[Model Saved] SYNTHETIC bundle saved to {SYNTHETIC_BUNDLE_PATH} (synthetic=true).")
    print("[Model Saved] The API ignores this file; production remains method='rule_based_...'.")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Train the MangoSense yield regressor.")
    parser.add_argument("--data-csv", default=None,
                        help="Path to a CSV with numeric features + a numeric yield target.")
    parser.add_argument("--target", default=None,
                        help="Target column name (default: yield_regressor.target in config).")
    parser.add_argument("--allow-synthetic", action="store_true",
                        help="Explicitly opt in to synthetic test training "
                             "(writes yield_model_synthetic.pkl, never loaded by the API).")
    args = parser.parse_args(argv)

    if args.data_csv:
        target = args.target or (_load_config().get("yield_regressor", {}) or {}).get(
            "target", "yield_tonnes_per_acre")
        return train_from_csv(args.data_csv, target)

    if args.allow_synthetic:
        return train_synthetic()

    print(REFUSAL_MESSAGE)
    return 2


if __name__ == "__main__":
    sys.exit(main())
