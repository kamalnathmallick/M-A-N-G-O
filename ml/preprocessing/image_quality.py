"""
Image Quality and Validation Module for MangoSense
Performs blur detection, brightness checks, and file integrity validation using OpenCV.
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple


def check_image_quality(
    image_input,
    blur_threshold: float = 60.0,
    min_brightness: float = 30.0,
    max_brightness: float = 245.0,
    min_dimension: int = 100
) -> Dict[str, Any]:
    """
    Validates input image against quality thresholds.

    Args:
        image_input: Can be a file path (str) or a numpy BGR image array.
        blur_threshold: Minimum Laplacian variance for non-blurry image.
        min_brightness: Minimum mean pixel brightness (0-255).
        max_brightness: Maximum mean pixel brightness (0-255).
        min_dimension: Minimum acceptable height and width.

    Returns:
        dict: Quality validation report with boolean is_valid flag and metrics.
    """
    if isinstance(image_input, str):
        img = cv2.imread(image_input)
        if img is None:
            return {
                "is_valid": False,
                "blur_score": 0.0,
                "is_blurry": True,
                "brightness": 0.0,
                "width": 0,
                "height": 0,
                "message": f"Unable to read image file or corrupted format: {image_input}"
            }
    elif isinstance(image_input, np.ndarray):
        img = image_input
    else:
        return {
            "is_valid": False,
            "blur_score": 0.0,
            "is_blurry": True,
            "brightness": 0.0,
            "width": 0,
            "height": 0,
            "message": "Unsupported image format or invalid byte array"
        }

    # 1. Dimension Check
    h, w = img.shape[:2]
    if h < min_dimension or w < min_dimension:
        return {
            "is_valid": False,
            "blur_score": 0.0,
            "is_blurry": False,
            "brightness": 0.0,
            "width": int(w),
            "height": int(h),
            "dimensions": (w, h),
            "message": f"Image dimensions too small ({w}x{h}). Minimum required: {min_dimension}x{min_dimension}"
        }

    # 2. Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Blur Detection using Laplacian Variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())
    is_blurry = blur_score < blur_threshold

    # 4. Brightness Assessment (Mean Intensity)
    brightness = float(np.mean(gray))
    is_too_dark = brightness < min_brightness
    is_overexposed = brightness > max_brightness

    # 5. Evaluate Overall Validity
    issues = []
    if is_blurry:
        issues.append(f"Image is blurry (Laplacian variance {blur_score:.1f} < {blur_threshold})")
    if is_too_dark:
        issues.append(f"Image is too dark (Mean brightness {brightness:.1f} < {min_brightness})")
    if is_overexposed:
        issues.append(f"Image is overexposed (Mean brightness {brightness:.1f} > {max_brightness})")

    is_valid = len(issues) == 0

    return {
        "is_valid": is_valid,
        "blur_score": round(blur_score, 2),
        "is_blurry": is_blurry,
        "brightness": round(brightness, 2),
        "width": int(w),
        "height": int(h),
        "dimensions": (w, h),
        "message": "Image quality validation passed" if is_valid else "; ".join(issues)
    }
