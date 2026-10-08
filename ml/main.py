"""
MangoSense Python ML Microservice (FastAPI)
Provides persistent HTTP endpoints for:
1. Flower Bud Quality & CNN Health Classification (/predict/bud)
2. Feature Fusion & Yield Regression (/predict/yield)
3. End-to-End Orchard Assessment (/predict/full)

Response shapes follow CONTRACT.md §2 exactly. Aggregate scores
(overallHealthScore, confidenceScore) are computed from real model outputs —
there are no hardcoded/simulated values, bounding boxes, or bud counts
(this dataset has no detection annotations, contract §0).
"""

import json
import os
import shutil
import tempfile
from typing import List, Optional, Tuple, Dict, Any

# Load ml/.env (if present) BEFORE reading any environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed: plain os.environ still works

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from inference.predict import BudPredictor, ALLOWED_EXTENSIONS
from inference.fusion import FeatureFusionPipeline

app = FastAPI(
    title="MangoSense ML Inference Service",
    description="PyTorch CNN & Scikit-learn Feature Fusion Service for Mango Bud & Yield Prediction",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment-driven configuration (.env.example documents every key)
MODEL_CONFIG_PATH = os.getenv("MODEL_CONFIG", "config/model_config.yaml")
CNN_WEIGHTS_PATH = os.getenv("CNN_WEIGHTS_PATH", "models/mangosense_cnn.pth")
YIELD_MODEL_PATH = os.getenv("YIELD_MODEL_PATH", "models/yield_model.pkl")
DEVICE = os.getenv("DEVICE", "").strip() or None  # empty -> auto (cuda if available)
_blur_env = os.getenv("BLUR_THRESHOLD", "").strip()
BLUR_THRESHOLD = float(_blur_env) if _blur_env else None

# Initialize Predictors
bud_predictor = BudPredictor(
    config_path=MODEL_CONFIG_PATH,
    weights_path=CNN_WEIGHTS_PATH,
    device=DEVICE,
    blur_threshold=BLUR_THRESHOLD,
)
fusion_pipeline = FeatureFusionPipeline(model_path=YIELD_MODEL_PATH)

MODEL_VERSION = bud_predictor.model_version


class YieldRequest(BaseModel):
    budHealth: float = 78.0
    variety: str = "Alphonso"
    temperature: float = 29.0
    humidity: float = 68.0
    rainfall: float = 2.0
    windSpeed: float = 12.0
    vaporPressureDeficit: str = "1.3 kPa"
    soilMoisture: str = "34%"
    plotAcres: float = 2.5
    cnnFeatures: Optional[List[float]] = None


# ---------------------------------------------------------------------------
# Shared per-image analysis (used by /predict/bud and /predict/full)
# ---------------------------------------------------------------------------
def _analyze_images(
    images: List[UploadFile],
    flowering_stage: str,
    canopy_direction: str = "General",
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[List[float]]]:
    """
    Runs extension check + quality check + inference on every uploaded file.

    Returns (image_entries, errors, feature_vectors):
      * image_entries — contract-shaped dicts for successful predictions
      * errors        — [{filename, message}] for rejected images (contract §2)
      * feature_vectors — internal CNN features (feature_dim each), NOT exposed
    """
    entries: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    feature_vectors: List[List[float]] = []

    temp_dir = tempfile.mkdtemp(prefix="mangosense_ml_")
    try:
        for idx, file in enumerate(images):
            safe_name = os.path.basename(file.filename or f"image-{idx + 1}.jpg")
            temp_path = os.path.join(temp_dir, f"{idx:04d}_{safe_name}")
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            prediction = bud_predictor.predict_image(
                temp_path, canopy_direction=canopy_direction
            )

            # Quality / extension failure -> errors, NEVER a 500 (contract §2)
            if not prediction.get("success"):
                errors.append({
                    "filename": safe_name,
                    "message": prediction.get(
                        "message", "Image quality is too low for reliable prediction."
                    ),
                })
                continue

            quality = prediction.get("quality") or {}
            classification = prediction.get("classification") or {}
            entries.append({
                "id": f"img-{idx + 1}",
                "filename": safe_name,
                "title": safe_name,
                "stage": flowering_stage,
                "classification": classification.get("label"),
                "confidence": classification.get("confidence", 0.0),
                "status": prediction.get("status", "poor_yield"),
                "risk": prediction.get("risk", {}),
                "notes": prediction.get("note", ""),
                "quality": {
                    "is_valid": bool(quality.get("is_valid", False)),
                    "blur_score": quality.get("blur_score", 0.0),
                    "brightness": quality.get("brightness", 0.0),
                    "width": quality.get("width", 0),
                    "height": quality.get("height", 0),
                },
                "model_version": prediction.get("model_version", MODEL_VERSION),
            })
            if prediction.get("feature_vector"):
                feature_vectors.append(prediction["feature_vector"])
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    return entries, errors, feature_vectors


def _flower_drop_risk(score: int) -> str:
    return "Low" if score >= 80 else ("Moderate" if score >= 70 else "High")


def _build_bud_response(
    entries: List[Dict[str, Any]],
    errors: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Aggregate statistics computed from REAL per-image model outputs."""
    n_ok = len(entries)
    n_rejected = len(errors)
    total_processed = n_ok + n_rejected

    if n_ok > 0:
        # overallHealthScore = round(mean P(GOOD) * 100)  [contract §2]
        p_good = [float(e["risk"].get("goodYield", 0.0)) for e in entries]
        overall_health = round(sum(p_good) / n_ok * 100)
        # confidenceScore = mean per-image confidence (percent), one decimal
        confidence = round(sum(float(e["confidence"]) for e in entries) / n_ok, 1)
        good_count = sum(1 for e in entries if e["status"] == "healthy")
        poor_count = sum(1 for e in entries if e["status"] == "poor_yield")
        good_pct = round(good_count / n_ok * 100)
        poor_pct = round(poor_count / n_ok * 100)
    else:
        # No analyzable image: every aggregate is the empty-set convention (0),
        # disclosed by rejectedCount == totalImagesAnalyzed. Not model output.
        overall_health = 0
        confidence = 0.0
        good_count = poor_count = 0
        good_pct = poor_pct = 0

    return {
        "success": True,
        "is_demo": bud_predictor.is_demo,
        "modelVersion": MODEL_VERSION,
        "summary": {
            "totalImagesAnalyzed": total_processed,
            "overallHealthScore": overall_health,
            "goodYieldCount": good_count,
            "poorYieldCount": poor_count,
            "rejectedCount": n_rejected,
            "confidenceScore": confidence,
            "flowerDropRisk": _flower_drop_risk(overall_health),
            "distribution": {
                "goodPercentage": good_pct,
                "poorPercentage": poor_pct,
                "goodRatio": good_pct,
                "poorRatio": poor_pct,
            },
        },
        "images": entries,
        "errors": errors,
    }


def _read_json_report(filename: str) -> Optional[Dict[str, Any]]:
    """Load a training/evaluation JSON written next to the checkpoint (if present).

    Tries the process-relative location first (the service runs from ml/), then
    a path anchored at this module's directory, so the endpoint works no matter
    where uvicorn was started from.
    """
    module_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(os.path.dirname(CNN_WEIGHTS_PATH) or ".", filename),
        os.path.join(module_dir, "models", filename),
    ]
    for path in candidates:
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else None
        except (OSError, ValueError):
            continue
    return None


def _count_dataset_classes(dataset_path: str, class_to_folder: Dict[str, int]) -> Dict[str, Any]:
    """Count class files on disk — the real 16 (GOOD 10 / BAD 6) split.

    Returns {"total": int, "perClass": {"GOOD": 10, "BAD": 6}, "onDisk": bool}.
    When the dataset folder is missing, onDisk is false and counts are null
    (the frontend then shows "Unavailable" instead of a fabricated number).
    """
    module_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [dataset_path, os.path.join(module_dir, dataset_path)]
    resolved = next((p for p in candidates if os.path.isdir(p)), None)

    per_class: Dict[str, int] = {}
    if class_to_folder and resolved:
        for folder in class_to_folder.keys():
            folder_path = os.path.join(resolved, folder)
            if not os.path.isdir(folder_path):
                continue
            count = sum(
                1 for entry in os.scandir(folder_path)
                if entry.is_file() and entry.path.lower().endswith(
                    tuple(ext.lower() for ext in ALLOWED_EXTENSIONS)
                )
            )
            per_class[folder] = count
    on_disk = bool(per_class)
    total = sum(per_class.values()) if on_disk else 0
    return {"total": total if on_disk else None, "perClass": per_class if on_disk else None, "onDisk": on_disk}


@app.get("/model/info")
def model_info():
    """Model card + last recorded evaluation (contract §14/§16).

    Every value is read from the files actually written by train.py/eval —
    nothing is hardcoded here. Missing files -> null values (the frontend
    shows "Unavailable (model not evaluated)" instead of inventing numbers).
    """
    cfg = bud_predictor.config or {}
    cnn_cfg = cfg.get("cnn", {})
    versions = cfg.get("model_versions", {})

    evaluation = _read_json_report("evaluation_report.json")
    training = _read_json_report("training_metrics.json")

    eval_metrics = (evaluation or {}).get("metrics") or None
    if isinstance(eval_metrics, dict):
        # Flatten for a stable frontend contract while keeping raw data.
        classification_report = (evaluation or {}).get("classification_report") or {}
        eval_metrics = {
            **eval_metrics,
            "accuracy": eval_metrics.get("accuracy"),
            "f1Macro": eval_metrics.get("f1_macro"),
            "classificationReport": classification_report,
        }

    dataset_info = (evaluation or {}).get("dataset") or (training or {}).get("dataset") or {}
    class_to_folder = cnn_cfg.get("class_to_folder") or dataset_info.get("class_to_index") or {}
    dataset_path = dataset_info.get("path") or "dataset/raw"
    dataset_counts = _count_dataset_classes(dataset_path, class_to_folder)

    return {
        "modelVersion": MODEL_VERSION,
        "architecture": "MobileNetV3-small"
        if str(cnn_cfg.get("backbone", "")) == "mobilenet_v3_small"
        else str(cnn_cfg.get("backbone", "unknown")),
        "backbone": cnn_cfg.get("backbone"),
        "numClasses": bud_predictor.num_classes,
        "classLabels": bud_predictor.class_names,
        "classToIndex": dataset_info.get("class_to_index") or class_to_folder,
        "inputSize": cnn_cfg.get("input_size", [224, 224]),
        "normalization": {"mean": cnn_cfg.get("mean"), "std": cnn_cfg.get("std")},
        "featureDim": bud_predictor.feature_dim,
        "checkpoint": CNN_WEIGHTS_PATH,
        "weightsLoaded": bud_predictor.model is not None,
        "isDemo": bud_predictor.is_demo,
        "device": bud_predictor.device,
        "dataset": {
            "path": dataset_path,
            "totalImages": dataset_counts["total"] if dataset_counts["onDisk"] else dataset_info.get("total_images"),
            "classCounts": dataset_counts["perClass"],
            "countedFromDisk": dataset_counts["onDisk"],
        },
        "split": (training or {}).get("split") or (evaluation or {}).get("split"),
        "evaluation": {
            "generatedAt": (evaluation or {}).get("generated_at"),
            "checkpoint": (evaluation or {}).get("checkpoint"),
            "metrics": eval_metrics,
            "confusionMatrix": (evaluation or {}).get("confusion_matrix"),
            "warnings": (evaluation or {}).get("warnings") or [],
        },
        "training": {
            "generatedAt": (training or {}).get("generated_at"),
            "model": (training or {}).get("model"),
            "epochsRun": ((training or {}).get("training") or {}).get("epochs_run"),
            "bestEpoch": ((training or {}).get("training") or {}).get("best_epoch"),
        },
        # Yield "model" is a RULE ENGINE only — trained:false is the fact that
        # governs every UI label; no trained regressor is implied here.
        "yieldModel": {
            "ruleVersion": versions.get("yield_rule"),
            "trained": fusion_pipeline.regressor is not None,
            "kind": "rule-engine" if fusion_pipeline.regressor is None else "regressor",
        },
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "MangoSense Python ML Service",
        "device": bud_predictor.device,
        "cnn_weights_loaded": bud_predictor.model is not None,
        "cnn_is_demo": bud_predictor.is_demo,
        "yield_model_loaded": fusion_pipeline.regressor is not None,
        "modelVersion": MODEL_VERSION,
    }


@app.post("/predict/bud")
async def predict_buds(
    images: List[UploadFile] = File(...),
    farmId: str = Form("farm-1"),
    plotId: str = Form("plot-a"),
    variety: str = Form("Alphonso (Hapus)"),
    floweringStage: str = Form("Panicle Elongation & Bloom"),
    canopyDirection: str = Form("General"),
    season: str = Form(""),
):
    """
    Accepts uploaded bud images, validates quality (OpenCV blur & illumination),
    runs CNN inference, and returns the flattened CONTRACT.md §2 response.
    Quality-failed images go to `errors` and never cause a 500.
    """
    entries, errors, _features = _analyze_images(images, floweringStage, canopyDirection)
    return _build_bud_response(entries, errors)


@app.post("/predict/yield")
def predict_yield_endpoint(req: YieldRequest):
    """
    Fuses bud health score with climate telemetry and estimates the yield range.
    Returns the flattened CONTRACT.md §2 response (rule-based until a real
    numeric-yield regressor is trained).
    """
    climate_dict = {
        "temperature": req.temperature,
        "humidity": req.humidity,
        "rainfall": req.rainfall,
        "windSpeed": req.windSpeed,
        "vaporPressureDeficit": req.vaporPressureDeficit,
        "soilMoisture": req.soilMoisture,
    }

    return fusion_pipeline.predict_yield(
        bud_health_score=req.budHealth,
        climate=climate_dict,
        variety=req.variety,
        cnn_features=req.cnnFeatures,
        plot_acres=req.plotAcres,
    )


@app.post("/predict/full")
async def predict_full_pipeline(
    images: List[UploadFile] = File(...),
    farmId: str = Form("farm-1"),
    plotId: str = Form("plot-a"),
    variety: str = Form("Alphonso (Hapus)"),
    floweringStage: str = Form("Panicle Elongation & Bloom"),
    canopyDirection: str = Form("General"),
    temperature: float = Form(29.0),
    humidity: float = Form(68.0),
    rainfall: float = Form(2.0),
    plotAcres: float = Form(2.5)
):
    """
    End-to-End Pipeline: Bud CNN Classification -> Feature Fusion -> Yield Estimation.
    CNN features from the bud stage ARE passed into fusion (previously dropped).
    """
    entries, errors, feature_vectors = _analyze_images(
        images, floweringStage, canopyDirection
    )
    bud_resp = _build_bud_response(entries, errors)

    health_score = bud_resp["summary"]["overallHealthScore"]
    cnn_features = None
    if feature_vectors:
        # Mean-pool real CNN feature vectors across analyzable images
        import numpy as np
        cnn_features = np.mean(np.asarray(feature_vectors, dtype=np.float32), axis=0).tolist()

    yield_resp = fusion_pipeline.predict_yield(
        bud_health_score=health_score,
        climate={"temperature": temperature, "humidity": humidity, "rainfall": rainfall},
        variety=variety,
        cnn_features=cnn_features,
        plot_acres=plotAcres,
    )

    return {
        "success": True,
        "is_demo": bud_predictor.is_demo,
        "budAnalysis": bud_resp,
        "yieldPrediction": yield_resp,
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("ML_HOST", "0.0.0.0")
    port = int(os.getenv("ML_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port)
