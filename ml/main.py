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
