"""
PyTorch Training Pipeline for the MangoSense Bud Classifier (binary: GOOD/BAD)

Includes:
  * Real dataset loading from dataset/raw/<CLASS>/ with optional metadata CSV groups
  * Stratified 60/20/20 split (fixed seed) OR group-aware split when a metadata CSV
    with farm_id/tree_id is present (see ml/README.md "Data Leakage Prevention")
  * Transfer learning backbones from config (mobilenet_v3_small default,
    resnet50 / efficientnet_b0 supported)
  * Train-split-only augmentation, validation every epoch, early stopping,
    BEST-checkpoint saving to models/mangosense_cnn.pth
  * Metrics (loss, accuracy, precision, recall, F1 macro + per-class) printed
    AND saved to models/training_metrics.json

The test split is NEVER used for training, gradient updates, or early stopping.
It is evaluated once, after training, by this script and again by evaluation/evaluate.py.

Honesty note: with the current 16-image sample the metrics are NOT production-grade;
a warning is printed and stored in the metrics file.
"""

import os
import sys
import json
import yaml
import random
import datetime
from typing import Dict, Any, List, Tuple

# Allow `python training/train.py` from ml/ to resolve top-level packages
# (models/, dataset/, ...) regardless of how the script was invoked.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import transforms
    from sklearn.metrics import (
        accuracy_score,
        precision_recall_fscore_support,
        classification_report,
        confusion_matrix,
    )
    from models.model_factory import build_model
    from dataset.dataset_loader import (
        inspect_dataset_directory,
        build_records_from_directory,
        split_dataset,
        MangoBudDataset,
    )
    TORCH_AVAILABLE = True
except ImportError as exc:
    TORCH_AVAILABLE = False
    IMPORT_ERROR = str(exc)

SMALL_SAMPLE_WARNING = (
    "SMALL SAMPLE SIZE: this dataset contains very few images. All metrics below are "
    "computed on a tiny held-out split and are NOT production-grade — treat them as a "
    "pipeline sanity check only, not as a measure of real-world performance."
)

CHECKPOINT_PATH = "models/mangosense_cnn.pth"
METRICS_PATH = "models/training_metrics.json"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def build_transforms(config: Dict[str, Any]) -> Tuple[transforms.Compose, transforms.Compose]:
    """Train transforms (augmented) and eval transforms (deterministic)."""
    cnn_cfg = config.get("cnn", {})
    size = tuple(cnn_cfg.get("input_size", [224, 224]))  # (h, w)
    mean = cnn_cfg.get("mean", [0.485, 0.456, 0.406])
    std = cnn_cfg.get("std", [0.229, 0.224, 0.225])
    aug = (config.get("training", {}) or {}).get("augmentation", {}) or {}

    normalize = transforms.Normalize(mean=mean, std=std)

    # Deterministic eval transform — no randomness, never leaks augmented data
    eval_tf = transforms.Compose([
        transforms.Resize(size[0]),
        transforms.CenterCrop(size),
        transforms.ToTensor(),
        normalize,
    ])

    scale = tuple(aug.get("random_resized_crop_scale", [0.75, 1.0]))
    cj = aug.get("color_jitter", {}) or {}
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(size, scale=scale),
        transforms.RandomHorizontalFlip(p=float(aug.get("horizontal_flip", 0.5))),
        transforms.RandomVerticalFlip(p=float(aug.get("vertical_flip", 0.25))),
        transforms.RandomRotation(degrees=float(aug.get("rotation_degrees", 20))),
        transforms.ColorJitter(
            brightness=float(cj.get("brightness", 0.2)),
            contrast=float(cj.get("contrast", 0.2)),
            saturation=float(cj.get("saturation", 0.2)),
            hue=float(cj.get("hue", 0.05)),
        ),
        transforms.ToTensor(),
        normalize,
    ])
    return train_tf, eval_tf


def compute_class_weights(records: List[Dict[str, Any]], num_classes: int) -> torch.Tensor:
    """Inverse-frequency class weights for the TRAIN split only."""
    counts = np.zeros(num_classes, dtype=np.float64)
    for r in records:
        counts[int(r["label_idx"])] += 1
    counts = np.maximum(counts, 1.0)
    weights = counts.sum() / (num_classes * counts)
    return torch.tensor(weights, dtype=torch.float32)


def run_epoch(model, loader, criterion, device, optimizer=None) -> Dict[str, Any]:
    """One pass over a loader. Trains when optimizer is given, otherwise evaluates."""
    training = optimizer is not None
    model.train() if training else model.eval()

    all_preds: List[int] = []
    all_labels: List[int] = []
    total_loss = 0.0
    n_samples = 0

    for images, labels, _groups in loader:
        images = images.to(device)
        labels = labels.to(device).long()

        if training:
            optimizer.zero_grad()

        with torch.set_grad_enabled(training):
            logits, _features = model(images)
            loss = criterion(logits, labels)
            if training:
                loss.backward()
                optimizer.step()

        batch_n = labels.size(0)
        total_loss += float(loss.item()) * batch_n
        n_samples += batch_n
        preds = torch.argmax(logits, dim=1)
        all_preds.extend(preds.cpu().tolist())
        all_labels.extend(labels.cpu().tolist())

    acc = accuracy_score(all_labels, all_preds) if all_labels else 0.0
    p, r, f1, _ = precision_recall_fscore_support(
        all_labels, all_preds, average="macro", zero_division=0
    ) if all_labels else (0.0, 0.0, 0.0, None)
    pc_p, pc_r, pc_f1, _ = precision_recall_fscore_support(
        all_labels, all_preds, average=None, zero_division=0
    ) if all_labels else ([], [], [], None)

    return {
        "loss": round(total_loss / max(n_samples, 1), 4),
        "accuracy": round(float(acc), 4),
        "precision": round(float(p), 4),
        "recall": round(float(r), 4),
        "f1_macro": round(float(f1), 4),
        "predictions": all_preds,
        "targets": all_labels,
        "per_class": [
            {"precision": round(float(pp), 4), "recall": round(float(rr), 4), "f1": round(float(ff), 4)}
            for pp, rr, ff in zip(pc_p, pc_r, pc_f1)
        ],
    }


def strip_runtime_keys(metrics: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in metrics.items() if k not in ("predictions", "targets")}


# ---------------------------------------------------------------------------
# Main training entry point
# ---------------------------------------------------------------------------
def train_cnn(config_path: str = "config/model_config.yaml", dataset_dir: str = "dataset/raw") -> int:
    """
    Train the CNN for real. Returns a process exit code (0 = success).
    """
    if not TORCH_AVAILABLE:
        print(f"[Training Error] PyTorch / torchvision / scikit-learn are required: {IMPORT_ERROR}")
        return 1

    # 1. Configuration
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    cnn_cfg = config.get("cnn", {})
    tr_cfg = config.get("training", {})
    seed = int(tr_cfg.get("seed", 42))
    set_seed(seed)

    # 2. Inspect dataset
    inspection = inspect_dataset_directory(dataset_dir)
    print(f"[Dataset Inspection] Total images: {inspection['total_images']}, "
          f"classes: {inspection.get('classes')}, status: {inspection['status']}")

    if inspection["total_images"] == 0:
        print("[Training Pipeline] No images found in dataset/raw. "
              "Place images in dataset/raw/<GOOD|BAD>/ and re-run. Exiting without saving weights.")
        return 1

    # 3. Build records (+ optional group metadata) and split
    metadata_csv = os.path.join(os.path.dirname(dataset_dir.rstrip("/\\")), "metadata.csv")
    records, class_to_idx = build_records_from_directory(
        dataset_dir,
        class_to_folder=cnn_cfg.get("class_to_folder"),
        metadata_csv=metadata_csv,
        group_aware_key=str(tr_cfg.get("group_aware_key", "farm_id")),
    )
    num_classes = int(cnn_cfg.get("num_classes", 2))
    max_label = max((r["label_idx"] for r in records), default=-1)
    if num_classes != len(class_to_idx) or max_label >= num_classes:
        print(f"[Training Error] config num_classes={num_classes} does not match dataset "
              f"classes {class_to_idx} (max label {max_label}). Fix config/model_config.yaml.")
        return 1

    train_records, val_records, test_records, strategy = split_dataset(records, config)
    class_names = [None] * num_classes
    for folder, idx in class_to_idx.items():
        class_names[idx] = folder
    print(f"[Split] strategy={strategy} | train={len(train_records)} "
          f"val={len(val_records)} test={len(test_records)} | classes={class_to_idx}")

    if len(train_records) < 2 or len(val_records) < 1 or len(test_records) < 1:
        print("[Training Error] Split produced an empty partition; add more images per class.")
        return 1

    warn_lines = [SMALL_SAMPLE_WARNING]
    if len(records) < 100:
        warn_lines.append(
            f"Dataset has only {len(records)} images (<100). Expect high variance between runs; "
            "collect more field data before relying on these numbers."
        )
        print(f"\n[WARNING] {warn_lines[0]}\n[WARNING] {warn_lines[1]}\n")

    # 4. DataLoaders
    train_tf, eval_tf = build_transforms(config)
    batch_size = int(tr_cfg.get("batch_size", 16))
    num_workers = int(tr_cfg.get("num_workers", 0))
    train_loader = DataLoader(MangoBudDataset(train_records, train_tf),
                              batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(MangoBudDataset(val_records, eval_tf),
                            batch_size=batch_size, shuffle=False, num_workers=num_workers)
    test_loader = DataLoader(MangoBudDataset(test_records, eval_tf),
                             batch_size=batch_size, shuffle=False, num_workers=num_workers)

    # 5. Model (transfer learning). Fall back to random init if weight download fails.
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training Pipeline] Using device: {device}")
    try:
        model = build_model(config=cnn_cfg, device=device)
    except Exception as e:
        print(f"[Training Pipeline] Could not load pretrained weights ({e}); "
              f"falling back to random initialization (pretrained=false).")
        model = build_model(config={**cnn_cfg, "pretrained": False}, device=device)

    # Verify the configured feature_dim matches the actual backbone output
    actual_feature_dim = int(model.feature_dim)
    configured_feature_dim = int(cnn_cfg.get("feature_dim", actual_feature_dim))
    if configured_feature_dim != actual_feature_dim:
        print(f"[Training Pipeline] NOTE: config cnn.feature_dim={configured_feature_dim} != "
              f"actual backbone feature_dim={actual_feature_dim}; using the ACTUAL value and "
              f"updating nothing silently — update config/model_config.yaml to {actual_feature_dim}.")
        warn_lines.append(
            f"config cnn.feature_dim ({configured_feature_dim}) does not match backbone "
            f"({actual_feature_dim}); actual value recorded here and used by inference."
        )

    freeze_backbone = bool(tr_cfg.get("freeze_backbone", True))
    if freeze_backbone:
        for name, param in model.named_parameters():
            if not name.startswith("classifier"):
                param.requires_grad = False
        trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
        total = sum(p.numel() for p in model.parameters())
        print(f"[Training Pipeline] Backbone FROZEN — training classifier head only "
              f"({trainable:,}/{total:,} params).")

    # 6. Loss / optimizer (only parameters that require grad)
    if bool(tr_cfg.get("use_class_weights", True)):
        class_weights = compute_class_weights(train_records, num_classes).to(device)
        print(f"[Training Pipeline] Class weights (train split): {class_weights.tolist()}")
        criterion = nn.CrossEntropyLoss(weight=class_weights)
    else:
        criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=float(tr_cfg.get("learning_rate", 0.0003)),
        weight_decay=float(tr_cfg.get("weight_decay", 0.0001)),
    )

    # 7. Training loop with validation each epoch + early stopping on val loss
    epochs = int(tr_cfg.get("epochs", 30))
    patience = int(tr_cfg.get("early_stopping_patience", 5))
    print(f"[Training Pipeline] Starting training: {epochs} epochs, "
          f"early_stopping_patience={patience}...")

    history = []
    best_val_loss = float("inf")
    best_epoch = -1
    best_val_metrics: Dict[str, Any] = {}
    epochs_without_improvement = 0

    for epoch in range(1, epochs + 1):
        train_metrics = run_epoch(model, train_loader, criterion, device, optimizer=optimizer)
        val_metrics = run_epoch(model, val_loader, criterion, device)

        history.append({
            "epoch": epoch,
            "train_loss": train_metrics["loss"],
            "train_accuracy": train_metrics["accuracy"],
            "val_loss": val_metrics["loss"],
            "val_accuracy": val_metrics["accuracy"],
            "val_precision": val_metrics["precision"],
            "val_recall": val_metrics["recall"],
            "val_f1_macro": val_metrics["f1_macro"],
        })
        print(f"Epoch {epoch:02d}/{epochs} | "
              f"train loss {train_metrics['loss']:.4f} acc {train_metrics['accuracy']:.3f} | "
              f"val loss {val_metrics['loss']:.4f} acc {val_metrics['accuracy']:.3f} "
              f"P {val_metrics['precision']:.3f} R {val_metrics['recall']:.3f} "
              f"F1 {val_metrics['f1_macro']:.3f}")

        # Checkpoint the BEST validation-loss weights
        if val_metrics["loss"] < best_val_loss:
            best_val_loss = val_metrics["loss"]
            best_epoch = epoch
            best_val_metrics = strip_runtime_keys(val_metrics)
            os.makedirs("models", exist_ok=True)
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= patience:
                print(f"[Early Stopping] No val-loss improvement for {patience} epochs "
                      f"(best epoch {best_epoch}). Stopping.")
                break

    if best_epoch == -1:
        print("[Training Error] No checkpoint was saved (validation never improved).")
        return 1

    # 8. Reload BEST weights, then evaluate ONCE on the held-out test set
    model = build_model(config={**cnn_cfg, "pretrained": False}, checkpoint_path=CHECKPOINT_PATH, device=device)
    model.eval()
    test_metrics = run_epoch(model, test_loader, criterion, device)
    test_public = strip_runtime_keys(test_metrics)

    print("\n=== Best-checkpoint metrics ===")
    print(f"Best epoch: {best_epoch} | checkpoint: {CHECKPOINT_PATH}")
    print(f"VAL   -> loss {best_val_metrics['loss']:.4f} | accuracy {best_val_metrics['accuracy']:.3f} | "
          f"precision {best_val_metrics['precision']:.3f} | recall {best_val_metrics['recall']:.3f} | "
          f"F1(macro) {best_val_metrics['f1_macro']:.3f}")
    print(f"TEST  -> loss {test_public['loss']:.4f} | accuracy {test_public['accuracy']:.3f} | "
          f"precision {test_public['precision']:.3f} | recall {test_public['recall']:.3f} | "
          f"F1(macro) {test_public['f1_macro']:.3f}")
    for i, name in enumerate(class_names):
        pc = test_public["per_class"][i]
        print(f"  TEST [{name}] precision {pc['precision']:.3f} recall {pc['recall']:.3f} f1 {pc['f1']:.3f}")

    print("\nTEST confusion matrix (rows=true, cols=pred):")
    cm = confusion_matrix(test_metrics["targets"], test_metrics["predictions"])
    print(cm)
    print("\nTEST classification report:")
    print(classification_report(
        test_metrics["targets"], test_metrics["predictions"],
        labels=list(range(num_classes)), target_names=class_names, zero_division=0
    ))

    # 9. Persist metrics (never invented — these are the actual computed values)
    metrics_doc = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dataset": {
            "path": dataset_dir,
            "total_images": len(records),
            "class_to_index": class_to_idx,
            "class_names": class_names,
        },
        "split": {
            "strategy": strategy,
            "seed": seed,
            "counts": {"train": len(train_records), "val": len(val_records), "test": len(test_records)},
            "group_metadata_csv": metadata_csv if os.path.isfile(metadata_csv) else None,
            "test_set_used_for_training": False,
        },
        "model": {
            "backbone": cnn_cfg.get("backbone", "mobilenet_v3_small"),
            "pretrained": bool(cnn_cfg.get("pretrained", True)),
            "num_classes": num_classes,
            "feature_dim_configured": configured_feature_dim,
            "feature_dim_actual": actual_feature_dim,
            "freeze_backbone": freeze_backbone,
            "checkpoint": CHECKPOINT_PATH,
        },
        "training": {
            "epochs_configured": epochs,
            "epochs_run": len(history),
            "best_epoch": best_epoch,
            "early_stopping_patience": patience,
            "batch_size": batch_size,
            "learning_rate": float(tr_cfg.get("learning_rate", 0.0003)),
            "class_weights": class_weights.tolist() if bool(tr_cfg.get("use_class_weights", True)) else None,
            "history": history,
        },
        "best_val_metrics": best_val_metrics,
        "test_metrics": test_public,
        "test_confusion_matrix": cm.tolist(),
        "test_classification_report": classification_report(
            test_metrics["targets"], test_metrics["predictions"],
            labels=list(range(num_classes)), target_names=class_names,
            zero_division=0, output_dict=True
        ),
        "warnings": warn_lines,
    }
    os.makedirs("models", exist_ok=True)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_doc, f, indent=2)
    print(f"\n[Training Pipeline] Best checkpoint saved to {CHECKPOINT_PATH}")
    print(f"[Training Pipeline] Metrics saved to {METRICS_PATH}")
    print(f"[WARNING] {SMALL_SAMPLE_WARNING}")
    return 0


if __name__ == "__main__":
    sys.exit(train_cnn())
