"""
Model Evaluation Module for MangoSense Bud Classification (binary GOOD/BAD)

Loads the trained checkpoint (models/mangosense_cnn.pth) and runs it ONCE on the
held-out test split (same deterministic split strategy/seed as training), prints a
confusion matrix + sklearn classification report, and saves the full report to
models/evaluation_report.json.

Run from ml/:  .\\venv\\Scripts\\python.exe evaluation/evaluate.py
"""

import os
import sys
import json
import yaml
import datetime

# Allow `python evaluation/evaluate.py` from ml/ to resolve top-level packages.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import torch
    from torch.utils.data import DataLoader
    from sklearn.metrics import classification_report, confusion_matrix
    from models.model_factory import build_model
    from dataset.dataset_loader import (
        inspect_dataset_directory,
        build_records_from_directory,
        split_dataset,
        MangoBudDataset,
    )
    from training.train import (
        run_epoch, strip_runtime_keys, build_transforms,
        CHECKPOINT_PATH, SMALL_SAMPLE_WARNING,
    )
    TORCH_AVAILABLE = True
    IMPORT_ERROR = None
except ImportError as exc:
    TORCH_AVAILABLE = False
    IMPORT_ERROR = str(exc)

CONFIG_PATH = "config/model_config.yaml"
DATASET_DIR = "dataset/raw"
REPORT_PATH = "models/evaluation_report.json"


def evaluate_model(config_path: str = CONFIG_PATH, dataset_dir: str = DATASET_DIR,
                   checkpoint_path: str = CHECKPOINT_PATH) -> int:
    if not TORCH_AVAILABLE:
        print(f"[Evaluation Error] Required packages missing: {IMPORT_ERROR}")
        return 1

    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    cnn_cfg = config.get("cnn", {})
    class_names = cnn_cfg.get("class_labels", ["Good Yield Potential", "Poor Yield Potential"])

    inspection = inspect_dataset_directory(dataset_dir)
    if inspection["total_images"] == 0:
        print(f"[Evaluation Error] No images found in {dataset_dir}. Nothing to evaluate.")
        return 1

    if not os.path.isfile(checkpoint_path):
        print(f"[Evaluation Error] Checkpoint not found: {checkpoint_path}. "
              "Run `python training/train.py` first.")
        return 1

    # Reproduce the exact training split (same seed + strategy) to get the test set
    metadata_csv = os.path.join(os.path.dirname(dataset_dir.rstrip("/\\")), "metadata.csv")
    records, class_to_idx = build_records_from_directory(
        dataset_dir,
        class_to_folder=cnn_cfg.get("class_to_folder"),
        metadata_csv=metadata_csv,
        group_aware_key=str(config.get("training", {}).get("group_aware_key", "farm_id")),
    )
    _train_r, _val_r, test_records, strategy = split_dataset(records, config)
    print(f"[Evaluation] Split strategy: {strategy} | test images: {len(test_records)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(config=cnn_cfg, checkpoint_path=checkpoint_path, device=device)
    model.eval()

    _train_tf, eval_tf = build_transforms(config)
    test_loader = DataLoader(
        MangoBudDataset(test_records, eval_tf),
        batch_size=int(config.get("training", {}).get("batch_size", 16)),
        shuffle=False,
        num_workers=0,
    )

    # Plain cross-entropy (weights are irrelevant for reporting; loss is informational)
    criterion = torch.nn.CrossEntropyLoss()
    metrics = run_epoch(model, test_loader, criterion, device)
    targets, preds = metrics["targets"], metrics["predictions"]
    num_classes = int(cnn_cfg.get("num_classes", 2))

    report_dict = classification_report(
        targets, preds,
        labels=list(range(num_classes)), target_names=class_names,
        zero_division=0, output_dict=True,
    )
    cm = confusion_matrix(targets, preds, labels=list(range(num_classes)))

    print("\n=== Evaluation Report (held-out test split) ===")
    print(f"Checkpoint: {checkpoint_path}")
    print(f"Loss {metrics['loss']:.4f} | Accuracy {metrics['accuracy']:.3f} | "
          f"Precision(macro) {metrics['precision']:.3f} | Recall(macro) {metrics['recall']:.3f} | "
          f"F1(macro) {metrics['f1_macro']:.3f}")
    print("\nConfusion matrix (rows=true, cols=pred):")
    print(cm)
    print("\nClassification report:")
    print(classification_report(targets, preds, labels=list(range(num_classes)),
                                target_names=class_names, zero_division=0))
    print(f"[WARNING] {SMALL_SAMPLE_WARNING}")

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    doc = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "checkpoint": checkpoint_path,
        "dataset": {"path": dataset_dir, "total_images": len(records), "class_to_index": class_to_idx},
        "split": {"strategy": strategy, "test_images": len(test_records),
                  "seed": int(config.get("training", {}).get("seed", 42))},
        "metrics": strip_runtime_keys(metrics),
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict,
        "warnings": [SMALL_SAMPLE_WARNING],
    }
    with open(REPORT_PATH, "w") as f:
        json.dump(doc, f, indent=2)
    print(f"[Evaluation] Report saved to {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(evaluate_model())
