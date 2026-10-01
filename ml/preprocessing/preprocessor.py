"""
Image Preprocessing Pipeline for Mango Flower Buds
Uses OpenCV for configurable resizing and PyTorch / torchvision for tensor normalization.
"""

import cv2
import numpy as np
from typing import Tuple, List, Optional

try:
    import torch
    from torchvision import transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


INTERPOLATION_MAP = {
    "INTER_LINEAR": cv2.INTER_LINEAR,
    "INTER_AREA": cv2.INTER_AREA,
    "INTER_CUBIC": cv2.INTER_CUBIC,
    "INTER_NEAREST": cv2.INTER_NEAREST
}


def apply_noise_filter(img_bgr: np.ndarray, mode: str = "none", strength: int = 10) -> np.ndarray:
    """
    Optional denoising (spec §9). Config-gated via preprocessing.noise_filter
    ("none" = disabled by default).

    Args:
        mode: "none" | "gaussian" | "nlmeans"
        strength: filter strength. For gaussian it is the kernel sigma; for
            nlmeans it maps to h (denoising strength).
    """
    mode = (mode or "none").lower()
    if mode in ("none", "", "off", "false"):
        return img_bgr
    if mode == "gaussian":
        k = max(1, int(strength) // 2 * 2 + 1)  # odd kernel
        return cv2.GaussianBlur(img_bgr, (k, k), sigmaX=max(0.5, float(strength) / 4.0))
    if mode == "nlmeans":
        return cv2.fastNlMeansDenoisingColored(
            img_bgr, None,
            h=float(strength),
            hColor=float(strength),
            templateWindowSize=7,
            searchWindowSize=21,
        )
    raise ValueError(f"Unknown noise_filter mode: {mode!r} (expected none|gaussian|nlmeans)")


def preprocess_image(
    image_input,
    target_size: Tuple[int, int] = (224, 224),
    interpolation_mode: str = "INTER_LINEAR",
    mean: List[float] = [0.485, 0.456, 0.406],
    std: List[float] = [0.229, 0.224, 0.225],
    noise_filter: str = "none",
    noise_filter_strength: int = 10
):
    """
    Preprocess image for CNN backbone.

    Args:
        image_input: File path (str) or numpy BGR array.
        target_size: (width, height) target dimensions.
        interpolation_mode: OpenCV interpolation method name
            (config key preprocessing.resize_interpolation).
        mean: RGB normalization mean vector.
        std: RGB normalization std vector.
        noise_filter: Optional denoising ("none" | "gaussian" | "nlmeans"),
            config key preprocessing.noise_filter (default disabled).
        noise_filter_strength: Denoising strength (config preprocessing.noise_filter_strength).

    Returns:
        torch.Tensor or np.ndarray (normalized RGB tensor/array [1, 3, H, W]).
    """
    if isinstance(image_input, str):
        img_bgr = cv2.imread(image_input)
        if img_bgr is None:
            raise ValueError(f"Could not load image at {image_input}")
    elif isinstance(image_input, np.ndarray):
        img_bgr = image_input
    else:
        raise TypeError("image_input must be file path or numpy array")

    # 0. Optional denoising (config-gated, default off)
    img_bgr = apply_noise_filter(img_bgr, noise_filter, noise_filter_strength)

    # 1. Resize using configurable OpenCV interpolation
    interp = INTERPOLATION_MAP.get(interpolation_mode, cv2.INTER_LINEAR)
    resized_bgr = cv2.resize(img_bgr, target_size, interpolation=interp)

    # 2. Convert BGR to RGB
    img_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)

    # 3. Normalize to [0.0, 1.0] float
    img_float = img_rgb.astype(np.float32) / 255.0

    # 4. Standardize with mean and std
    mean_arr = np.array(mean, dtype=np.float32)
    std_arr = np.array(std, dtype=np.float32)
    normalized = (img_float - mean_arr) / std_arr

    # Transpose from (H, W, C) to (C, H, W)
    transposed = np.transpose(normalized, (2, 0, 1))
    batch_ready = np.expand_dims(transposed, axis=0)

    if TORCH_AVAILABLE:
        return torch.from_numpy(batch_ready).float()

    return batch_ready
