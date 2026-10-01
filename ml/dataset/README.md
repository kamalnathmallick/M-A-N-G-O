# MangoSense Flower Bud Dataset Specification

This directory holds the raw bud/panicle image dataset collected from mango groves.
Labels are **binary** (contract §0): `GOOD` → class index 0
("Good Yield Potential", status `healthy`), `BAD` → class index 1
("Poor Yield Potential", status `poor_yield`).

## Directory Structure Format

```text
ml/dataset/
├── raw/
│   ├── GOOD/                       # class index 0 (currently 10 images)
│   │   ├── farm1_tree3_sample01.jpg
│   │   └── ...
│   └── BAD/                        # class index 1 (currently 6 images)
│       └── ...
├── metadata.csv (Optional: image_path, label, farm_id, tree_id, canopy_direction, variety, date)
└── splits/                         # optional pre-computed splits
    ├── train.csv
    ├── val.csv
    └── test.csv
```

- Accepted extensions: `.jpg`, `.jpeg`, `.png` (`.webp` is tolerated by the training
  loader but rejected by the inference allow-list).
- Folder → class index mapping lives in `config/model_config.yaml → cnn.class_to_folder`.
- The dataset contains **no bounding boxes and no bud counts** — models must never
  fabricate detection outputs.

## Data Leakage Prevention Strategy
Images belonging to the same orchard grove or tree (`farm_id` / `tree_id`) must remain
isolated within either `train`, `val`, or `test`.

- If `metadata.csv` is present with a group column (`farm_id`, `tree_id`, or
  `group_id`) and ≥ 3 distinct groups, `create_group_aware_splits()` /
  `split_dataset()` in `dataset_loader.py` enforce **GroupShuffleSplit** across those
  identifiers.
- Without group metadata (the current 16-image dataset), a deterministic
  **stratified 60/20/20 split with seed 42** is used instead — this is printed at
  training time and recorded in `models/training_metrics.json → split.strategy`.
