"""
Inference Module for MangoSense Bud Analysis (binary classification)

Validates image quality, enforces the filename allow-list, extracts CNN deep
features (full configured feature_dim) and predicts the binary bud class:

    index 0 -> "Good Yield Potential" / status "healthy"
    index 1 -> "Poor Yield Potential"  / status "poor_yield"

This dataset contains no detection annotations, so NO detected_buds / healthy_buds /
affected_buds / boxes keys are ever produced (contract §0).
"""

import os
import yaml
from typing import Dict, Any, Optional, List
import numpy as np

from preprocessing.image_quality import check_image_quality
from preprocessing.preprocessor import preprocess_image

try:
    import torch
    import torch.nn.functional as F
    from models.model_factory import build_model
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# Filename extension allow-list (contract §0 / spec: jpg, jpeg, png only)
ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png")

# Fallback labels if config is missing (binary)
CLASS_NAMES = [
    "Good Yield Potential",
    "Poor Yield Potential",
]

STATUS_BY_INDEX = {0: "healthy", 1: "poor_yield"}


class BudPredictor:
    def __init__(
        self,
        config_path: str = "config/model_config.yaml",
        weights_path: Optional[str] = None,
        device: Optional[str] = None,
        blur_threshold: Optional[float] = None,
    ):
        self.config: Dict[str, Any] = {}
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                self.config = yaml.safe_load(f) or {}

        cnn_cfg = self.config.get("cnn", {})
        self.class_names: List[str] = list(cnn_cfg.get("class_labels", CLASS_NAMES))
        self.num_classes = int(cnn_cfg.get("num_classes", len(self.class_names)))
        self.feature_dim = int(cnn_cfg.get("feature_dim", 576))
        self.model_version = str(
            self.config.get("model_versions", {}).get("cnn", "mangosense-cnn-v1")
        )
        self.weights_path = weights_path or "models/mangosense_cnn.pth"

        if device:
            self.device = device
        else:
            self.device = "cuda" if (TORCH_AVAILABLE and torch.cuda.is_available()) else "cpu"

        # Optional environment override (BLUR_THRESHOLD in .env)
        self.blur_threshold_override = blur_threshold

        self.model = None
        if TORCH_AVAILABLE and os.path.isfile(self.weights_path):
            try:
                self.model = build_model(
                    config=cnn_cfg,
                    checkpoint_path=self.weights_path,
                    device=self.device,
                )
                self.model.eval()
                # Record the ACTUAL backbone feature dimension
                self.feature_dim = int(self.model.feature_dim)
                print(f"[BudPredictor] Loaded trained checkpoint from {self.weights_path} "
                      f"(feature_dim={self.feature_dim}, device={self.device})")
            except Exception as e:
                self.model = None
                print(f"[BudPredictor] Error loading checkpoint '{self.weights_path}': {e}. "
                      f"Falling back to untrained demo mode (is_demo=true).")
        elif not os.path.isfile(self.weights_path):
            print(f"[BudPredictor] No checkpoint at {self.weights_path} — serving honest "
                  f"demo output (is_demo=true) until training/train.py is run.")

    # ------------------------------------------------------------------
    @property
    def is_demo(self) -> bool:
        """True only when NO trained checkpoint is loaded (contract §2)."""
        return self.model is None

    # ------------------------------------------------------------------
    def _quality_check(self, image_path: str) -> Dict[str, Any]:
        pre = self.config.get("preprocessing", {})
        blur_threshold = (
            self.blur_threshold_override
            if self.blur_threshold_override is not None
            else float(pre.get("blur_laplacian_threshold", 60.0))
        )
        return check_image_quality(
            image_path,
            blur_threshold=blur_threshold,
            min_brightness=float(pre.get("min_brightness", 30.0)),
            max_brightness=float(pre.get("max_brightness", 245.0)),
            min_dimension=int(pre.get("min_dimension", 100)),
        )

    def _failure(self, message: str, quality: Optional[Dict[str, Any]],
                 image_path: str) -> Dict[str, Any]:
        """
        Structured quality/extension failure. main.py routes these to `errors`
        (never to `images`), so no KeyError is possible: `success` is False and
        `classification` is explicitly None.
        """
        return {
            "success": False,
            "status": "rejected",
            "classification": None,
            "message": message,
            "quality": quality,
            "image_path": image_path,
            "model_version": self.model_version,
        }

    # ------------------------------------------------------------------
    def predict_image(self, image_path: str, canopy_direction: str = "General") -> Dict[str, Any]:
        """
        Run end-to-end extension/quality validation and prediction on a single image file.
        """
        # 0. Filename extension allow-list (jpg / jpeg / png)
        ext = os.path.splitext(image_path)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return self._failure(
                f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}.",
                None,
                image_path,
            )

        # 1. Image quality validation (OpenCV blur, illumination, dimensions)
        quality = self._quality_check(image_path)
        if not quality["is_valid"]:
            return self._failure(
                f"Image quality is too low for reliable prediction. {quality['message']}",
                quality,
                image_path,
            )

        pre = self.config.get("preprocessing", {})
        cnn_cfg = self.config.get("cnn", {})
        input_size = tuple(cnn_cfg.get("input_size", [224, 224]))

        # 2. Real inference when a trained checkpoint is loaded
        if self.model is not None and TORCH_AVAILABLE:
            try:
                tensor = preprocess_image(
                    image_path,
                    target_size=(int(input_size[1]), int(input_size[0])),
                    interpolation_mode=str(pre.get("resize_interpolation", "INTER_LINEAR")),
                    mean=cnn_cfg.get("mean", [0.485, 0.456, 0.406]),
                    std=cnn_cfg.get("std", [0.229, 0.224, 0.225]),
                    noise_filter=str(pre.get("noise_filter", "none")),
                    noise_filter_strength=int(pre.get("noise_filter_strength", 10)),
                ).to(self.device)

                with torch.no_grad():
                    logits, features = self.model(tensor)
                    probs = F.softmax(logits, dim=1).cpu().numpy()[0]
                    feature_vector = features.cpu().numpy()[0].tolist()  # full feature_dim

                pred_idx = int(np.argmax(probs))
                pred_idx = min(pred_idx, len(self.class_names) - 1)
                confidence = float(probs[pred_idx])

                if self.num_classes >= 2:
                    risk = {"goodYield": float(probs[0]), "poorYield": float(probs[1])}
                else:
                    risk = {"goodYield": float(probs[0]), "poorYield": 0.0}

                return {
                    "success": True,
                    "is_demo": False,
                    "classification": {
                        "label": self.class_names[pred_idx],
                        "confidence": round(confidence * 100, 1),
                    },
                    "status": STATUS_BY_INDEX.get(pred_idx, "poor_yield"),
                    "risk": risk,
                    "feature_vector": feature_vector,  # full feature_dim; stripped from API responses
                    "quality": quality,
                    "model_version": self.model_version,
                    "note": "",
                }
            except Exception as e:
                print(f"[Inference Error] {e}")
                return self._failure(
                    f"Model inference failed: {e}",
                    quality,
                    image_path,
                )

        # 3. No checkpoint loaded -> honest demo output (contract §2: is_demo=true ONLY here)
        #    Equal class probabilities are emitted deliberately: these are NOT model
        #    predictions and must not be presented as such.
        probs = np.full(self.num_classes, 1.0 / self.num_classes, dtype=np.float64)
        return {
            "success": True,
            "is_demo": True,
            "classification": {
                "label": self.class_names[0],
                "confidence": round(float(probs[0]) * 100, 1),
            },
            "status": STATUS_BY_INDEX.get(0, "healthy"),
            "risk": (
                {"goodYield": float(probs[0]), "poorYield": float(probs[1])}
                if self.num_classes >= 2 else {"goodYield": float(probs[0]), "poorYield": 0.0}
            ),
            "feature_vector": [0.0] * self.feature_dim,
            "quality": quality,
            "model_version": self.model_version,
            "note": (
                "DEMO MODE: no trained CNN checkpoint is loaded, so class probabilities are "
                "uniform (50/50) placeholders, NOT a model prediction. Train the model "
                "(training/train.py) to enable real inference."
            ),
        }
