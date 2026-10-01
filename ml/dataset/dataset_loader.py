"""
Dataset Loader and Group-Aware Splitting Pipeline for Mango Flower Buds
Implements group-aware dataset splitting to prevent data leakage across farms, orchards, or trees,
plus a deterministic stratified fallback for datasets without group metadata.
"""

import os
import glob
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

try:
    from sklearn.model_selection import GroupShuffleSplit, train_test_split
    from PIL import Image
    import torch
    from torch.utils.data import Dataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

VALID_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


class MangoBudDataset(Dataset if TORCH_AVAILABLE else object):
    """
    PyTorch Dataset for Mango Flower Bud images with metadata and group tracking.
    """
    def __init__(self, records: List[Dict[str, Any]], transform=None):
        self.records = records
        self.transform = transform

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        item = self.records[idx]
        image_path = item["image_path"]
        label = item["label_idx"]

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        img = Image.open(image_path).convert("RGB")

        if self.transform:
            img = self.transform(img)

        return img, label, item.get("group_id", "default_farm")


def inspect_dataset_directory(dataset_dir: str) -> Dict[str, Any]:
    """
    Inspects folder structure, counts samples, verifies image validity,
    and identifies class labels and class distribution.
    """
    if not os.path.exists(dataset_dir):
        return {
            "status": "pending_collection",
            "message": f"Dataset directory '{dataset_dir}' does not exist yet. Using prototype baseline.",
            "total_images": 0,
            "classes": []
        }

    class_counts = {}
    all_files = []

    for root, dirs, files in os.walk(dataset_dir):
        class_name = os.path.basename(root)
        if class_name and class_name != os.path.basename(dataset_dir):
            images = [os.path.join(root, f) for f in files if f.lower().endswith(VALID_IMAGE_EXTENSIONS)]
            if images:
                class_counts[class_name] = len(images)
                all_files.extend(images)

    return {
        "status": "inspected" if all_files else "empty",
        "dataset_path": dataset_dir,
        "total_images": len(all_files),
        "classes": class_counts,
        "is_imbalanced": len(set(class_counts.values())) > 1 if class_counts else False
    }


def build_records_from_directory(
    dataset_dir: str,
    class_to_folder: Optional[Dict[str, int]] = None,
    metadata_csv: Optional[str] = None,
    group_aware_key: str = "farm_id"
) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Builds a flat list of sample records from `dataset_dir/<CLASS_FOLDER>/<image>`.

    Args:
        dataset_dir: Root folder containing one sub-folder per class (e.g. dataset/raw/GOOD).
        class_to_folder: Mapping folder-name -> class index (e.g. {"GOOD": 0, "BAD": 1}).
            Matching is case-insensitive. If None, folders are sorted alphabetically
            and assigned indices 0..N-1.
        metadata_csv: Optional CSV with columns image_path (or filename), label and
            optionally group columns (farm_id / tree_id). When a `group_aware_key`
            column is present, each record receives a `group_id` so that
            create_group_aware_splits() can keep whole farms/trees in one split
            (leakage prevention). Without it, records carry no group and a
            stratified split is used instead.
        group_aware_key: Configured group column name ("farm_id" by default).

    Returns:
        (records, class_to_idx)
    """
    if not os.path.isdir(dataset_dir):
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    # Resolve folder -> index mapping
    folder_names = sorted(
        d for d in os.listdir(dataset_dir)
        if os.path.isdir(os.path.join(dataset_dir, d))
    )
    if class_to_folder:
        class_to_idx = {str(k).upper(): int(v) for k, v in class_to_folder.items()}
        for name in folder_names:
            if name.upper() not in class_to_idx:
                raise ValueError(
                    f"Class folder '{name}' is not present in cnn.class_to_folder {sorted(class_to_idx)}. "
                    f"Add it to config/model_config.yaml."
                )
    else:
        class_to_idx = {name.upper(): i for i, name in enumerate(folder_names)}

    records: List[Dict[str, Any]] = []
    for folder in folder_names:
        idx = class_to_idx[folder.upper()]
        for path in sorted(glob.glob(os.path.join(dataset_dir, folder, "*"))):
            if not path.lower().endswith(VALID_IMAGE_EXTENSIONS):
                continue
            records.append({
                "image_path": path,
                "filename": os.path.basename(path),
                "class_folder": folder,
                "label_idx": idx,
            })

    # Optional metadata enrichment (group-aware splitting)
    group_key = (group_aware_key or "farm_id").strip()
    if metadata_csv and os.path.isfile(metadata_csv):
        meta = pd.read_csv(metadata_csv)
        key_col = None
        for candidate in (group_key, "farm_id", "tree_id", "group_id"):
            if candidate in meta.columns:
                key_col = candidate
                break
        if key_col is None:
            print(f"[Dataset] metadata.csv found but has no group column "
                  f"({group_key}/farm_id/tree_id/group_id) -> stratified split will be used.")
        else:
            path_col = "image_path" if "image_path" in meta.columns else (
                "filename" if "filename" in meta.columns else None)
            if path_col is None:
                print("[Dataset] metadata.csv has no image_path/filename column -> ignoring metadata.")
            else:
                lookup = {}
                for _, row in meta.iterrows():
                    key = os.path.basename(str(row[path_col]))
                    if key_col in meta.columns and pd.notna(row[key_col]):
                        lookup[key] = str(row[key_col])
                matched = 0
                for rec in records:
                    if rec["filename"] in lookup:
                        rec["group_id"] = lookup[rec["filename"]]
                        matched += 1
                print(f"[Dataset] metadata.csv: matched {matched}/{len(records)} images to group "
                      f"column '{key_col}'.")
                if matched < len(records):
                    print("[Dataset] Warning: some images lack group metadata; they will be "
                          "grouped as 'unassigned' and may be split across sets.")

    return records, class_to_idx


def create_stratified_splits(
    records: List[Dict[str, Any]],
    train_frac: float = 0.6,
    val_frac: float = 0.2,
    test_frac: float = 0.2,
    random_state: int = 42
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Deterministic stratified train/val/test split (label-preserving).

    Used when NO group metadata (farm_id/tree_id) is available. Requires
    train_frac + val_frac + test_frac == 1.0.
    """
    if not np.isclose(train_frac + val_frac + test_frac, 1.0):
        raise ValueError("train + val + test fractions must sum to 1.0")

    labels = [r["label_idx"] for r in records]
    indices = list(range(len(records)))

    # 1. Hold out the test set first (never touched during training)
    train_val_idx, test_idx = train_test_split(
        indices, test_size=test_frac, random_state=random_state, stratify=labels
    )
    labels_tv = [labels[i] for i in train_val_idx]

    # 2. Split train vs validation from the remainder
    rel_val = val_frac / (train_frac + val_frac)
    train_idx, val_idx = train_test_split(
        train_val_idx, test_size=rel_val, random_state=random_state, stratify=labels_tv
    )

    pick = lambda idxs: [records[i] for i in idxs]
    return pick(train_idx), pick(val_idx), pick(test_idx)


def create_group_aware_splits(
    records: List[Dict[str, Any]],
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = 42
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Splits records into Train, Validation, and Test sets using GroupShuffleSplit.
    Images from the same farm/tree (group_id) will NEVER be split between sets,
    preventing catastrophic data leakage.
    """
    df = pd.DataFrame(records)
    if "group_id" not in df.columns or df["group_id"].nunique() < 3:
        # Fallback to random stratified split if no group identifiers exist
        print("[Dataset Split] Notice: Group keys < 3. Performing standard split.")
        shuffled = df.sample(frac=1.0, random_state=random_state).to_dict("records")
        n_total = len(shuffled)
        n_test = int(n_total * test_size)
        n_val = int(n_total * val_size)
        test_records = shuffled[:n_test]
        val_records = shuffled[n_test:n_test + n_val]
        train_records = shuffled[n_test + n_val:]
        return train_records, val_records, test_records

    # 1. Split Train+Val vs Test
    gss_test = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_val_idx, test_idx = next(gss_test.split(df, groups=df["group_id"]))

    train_val_df = df.iloc[train_val_idx].reset_index(drop=True)
    test_df = df.iloc[test_idx].reset_index(drop=True)

    # 2. Split Train vs Val
    val_ratio_adj = val_size / (1.0 - test_size)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=val_ratio_adj, random_state=random_state)
    train_idx, val_idx = next(gss_val.split(train_val_df, groups=train_val_df["group_id"]))

    train_df = train_val_df.iloc[train_idx].reset_index(drop=True)
    val_df = train_val_df.iloc[val_idx].reset_index(drop=True)

    print(f"[Group Split] Train groups: {train_df['group_id'].nunique()}, Val groups: {val_df['group_id'].nunique()}, Test groups: {test_df['group_id'].nunique()}")

    return train_df.to_dict("records"), val_df.to_dict("records"), test_df.to_dict("records")


def split_dataset(
    records: List[Dict[str, Any]],
    config: Dict[str, Any],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], str]:
    """
    Unified split entry point used by both training and evaluation so that both
    produce IDENTICAL splits (same seed, same strategy).

    Returns (train, val, test, strategy_name).

    Strategy selection:
      * Records carry a `group_id` (metadata CSV with farm_id/tree_id present and
        >= 3 distinct groups)  -> group-aware GroupShuffleSplit (leakage prevention).
      * Otherwise              -> deterministic stratified split.
    """
    tr_cfg = config.get("training", {}) if config else {}
    seed = int(tr_cfg.get("seed", 42))
    split_cfg = tr_cfg.get("split", {}) or {}
    train_frac = float(split_cfg.get("train", 0.6))
    val_frac = float(split_cfg.get("val", 0.2))
    test_frac = float(split_cfg.get("test", 0.2))
    group_key = str(tr_cfg.get("group_aware_key", "farm_id"))

    has_groups = (
        len(records) > 0
        and all("group_id" in r for r in records)
        and len({r["group_id"] for r in records}) >= 3
    )

    if has_groups:
        print(f"[Split] Group-aware splitting ACTIVE using column '{group_key}': "
              f"images from the same farm/tree never cross splits.")
        # Map fractional splits onto the GroupShuffleSplit signature
        train_val = train_frac + val_frac
        test_size = test_frac
        val_size = val_frac / train_val if train_val > 0 else 0.25
        train_r, val_r, test_r = create_group_aware_splits(
            records, test_size=test_size, val_size=val_size, random_state=seed
        )
        return train_r, val_r, test_r, f"group_aware ({group_key})"

    print(f"[Split] Group-aware splitting INACTIVE (no metadata CSV with "
          f"'{group_key}'/'tree_id' and >= 3 groups) -> stratified "
          f"{int(train_frac * 100)}/{int(val_frac * 100)}/{int(test_frac * 100)} split, seed={seed}.")
    train_r, val_r, test_r = create_stratified_splits(
        records, train_frac=train_frac, val_frac=val_frac, test_frac=test_frac, random_state=seed
    )
    return train_r, val_r, test_r, f"stratified {int(train_frac * 100)}/{int(val_frac * 100)}/{int(test_frac * 100)}"
