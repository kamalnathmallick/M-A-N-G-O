# MangoSense Machine Learning Component 🧠🥭

The **MangoSense ML Component** is a Python-based microservice for binary bud-image
classification (Good vs. Poor yield potential), deep-feature extraction, and
yield estimation for mango orchards.

---

## 1. System Pipeline Flow

```text
Mango Bud Image
        ↓
Image Quality Gate (OpenCV blur / illumination / dimensions, extension allow-list)
        ↓
CNN Feature Extractor & Binary Classifier (MobileNetV3 / ResNet50 / EfficientNet)
        ↓
"Good Yield Potential" (P_good)  /  "Poor Yield Potential" (P_poor) + 576-d feature vector
        ↓
Feature Fusion (CNN features + normalized climate vector + variety factor)
        ↓
Yield Estimation — rule-based until a numeric-yield dataset exists
        ↓
Yield Range (tonnes / acre & total plot tonnage)
```

---

## 2. Directory Structure

```text
ml/
├── config/
│   └── model_config.yaml        # Binary classes, backbone, augmentation, split fractions
├── dataset/
│   ├── dataset_loader.py        # Record building + stratified / group-aware splits
│   ├── README.md                # Dataset folder specification
│   └── raw/                     # Image dataset (see §3)
├── models/
│   ├── model_factory.py         # PyTorch CNN factory with feature extractor
│   ├── mangosense_cnn.pth       # Trained CNN checkpoint (created by training/train.py)
│   ├── training_metrics.json    # Real training/val/test metrics from the last run
│   └── evaluation_report.json   # Held-out test evaluation (evaluation/evaluate.py)
├── preprocessing/
│   ├── image_quality.py         # Blur (Laplacian variance) & illumination checks
│   └── preprocessor.py          # Configurable resize/interpolation + optional denoising
├── inference/
│   ├── predict.py               # End-to-end per-image prediction
│   └── fusion.py                # Feature fusion & yield estimation
├── training/
│   ├── train.py                 # Real CNN training pipeline (see §6)
│   └── train_yield_regressor.py # Yield regressor — REQUIRES a real CSV (see §7)
├── evaluation/
│   └── evaluate.py              # Held-out test evaluation + report JSON
├── main.py                      # FastAPI HTTP microservice
├── requirements.txt             # Python dependencies
└── README.md
```

**What exists vs. what does not (honest status):**

| Artifact | Status |
| :--- | :--- |
| `models/mangosense_cnn.pth` | ✅ EXISTS — real weights, trained on the 16-image dataset (metrics in §6) |
| `models/training_metrics.json` | ✅ EXISTS — actual numbers from the last training run |
| `models/evaluation_report.json` | ✅ EXISTS — actual held-out test evaluation |
| `models/yield_model.pkl` | ❌ DOES NOT EXIST — no numeric-yield dataset is available yet. The API therefore serves the disclosed **rule-based** yield path (`trained: false`, `method: "rule_based_pending_yield_dataset"`). Train one with `training/train_yield_regressor.py --data-csv …` (§7). |
| `models/yield_model_synthetic.pkl` | Only after explicitly running `--allow-synthetic`; flagged `synthetic: true` and **never loaded** by the API. |

---

## 3. Dataset (binary)

```text
ml/dataset/
├── raw/
│   ├── GOOD/          # 10 images → class index 0 → "Good Yield Potential" / status "healthy"
│   └── BAD/           #  6 images → class index 1 → "Poor Yield Potential"  / status "poor_yield"
└── metadata.csv       # OPTIONAL: image_path, label, farm_id / tree_id (enables group-aware split)
```

* Format: `.jpg` / `.jpeg` / `.png` (inference also enforces this allow-list),
  1200×1600 / 1600×1200.
* **This dataset contains no bounding boxes or bud counts — the API therefore never
  emits `detectedBuds` / `healthyBuds` / `affectedBuds` / `boxes`.**
* Labels are **binary**; the old 4-class labels (Healthy/Hopper/Mildew/Drop) were removed.

### Adding / preparing more data
1. Drop images into `ml/dataset/raw/GOOD/` and `ml/dataset/raw/BAD/` (or any folder
   names listed under `cnn.class_to_folder` in `config/model_config.yaml`).
2. Optionally add `ml/dataset/metadata.csv` with columns
   `image_path,label,farm_id` (or `tree_id`) so group-aware splitting activates.
3. Re-run training (§6). No cleanup needed — the best-validation checkpoint is
   simply overwritten.

---

## 4. Data Leakage Prevention

* **With `metadata.csv` containing a `farm_id` (or `tree_id`) column and ≥ 3 distinct
  groups**: `create_group_aware_splits()` (GroupShuffleSplit) activates so images from
  the same farm/tree NEVER cross train/val/test. The chosen strategy is printed and
  recorded in `training_metrics.json` under `split.strategy`.
* **Without group metadata (the current 16-image dataset)**: a deterministic
  **stratified 60/20/20** split with `seed: 42` is used instead — class ratios are
  preserved in every partition, and the split is identical for training and evaluation.
* **The test split is never used for training, gradient updates, early stopping, or
  augmentation.**

---

## 5. Setup & Running the ML Service

```bash
cd ml

# 1. (Only if no venv exists yet) create one and install dependencies
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# 2. Configure environment (optional — defaults shown)
copy .env.example .env         # ML_PORT, MODEL_CONFIG, CNN_WEIGHTS_PATH, …

# 3. Start the service (loads .env via python-dotenv)
venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
# ...or: venv\Scripts\python.exe main.py   (uses ML_HOST / ML_PORT)
```

Environment keys (all wired in `main.py`, see `.env.example`):
`ML_PORT`, `ML_HOST`, `MODEL_CONFIG`, `CNN_WEIGHTS_PATH`, `YIELD_MODEL_PATH`,
`DEVICE`, `BLUR_THRESHOLD`.

---

## 6. Model Training & Evaluation (real runs)

```bash
cd ml

# Train the CNN (transfer learning, early stopping, best-val checkpoint)
venv\Scripts\python.exe training/train.py

# Evaluate the saved checkpoint on the held-out TEST split
venv\Scripts\python.exe evaluation/evaluate.py
```

Training details: MobileNetV3-Small (ImageNet-pretrained, backbone frozen — classifier
head only), AdamW, batch size 16, lr 3e-4, inverse-frequency class weights,
train-split-only augmentation (random resized crop / flips / rotation / color jitter),
validation every epoch, early stopping (patience 5) on val loss, best checkpoint →
`models/mangosense_cnn.pth`, metrics → `models/training_metrics.json`.

### ⚠️ Actual metrics from the current 16-image dataset

Split: **stratified 60/20/20, seed 42 → train 9 / val 3 / test 4**.
These are the real numbers written to `models/training_metrics.json` and
`models/evaluation_report.json`:

| Metric | Validation (best epoch 30) | Held-out Test |
| :--- | ---: | ---: |
| Loss | 0.5643 | 0.4764 (eval: 0.4591, unweighted CE) |
| Accuracy | 66.7% | 75.0% |
| Precision (macro) | 75.0% | 37.5% |
| Recall (macro) | 75.0% | 50.0% |
| F1 (macro) | 66.7% | 42.9% |

Test per-class: **Good Yield Potential** P 0.75 / R 1.00 / F1 0.86 ·
**Poor Yield Potential** P 0.00 / R 0.00 / F1 0.00 (confusion matrix `[[3,0],[1,0]]` —
the model labelled all 4 test images as GOOD).

**These metrics are NOT production-grade.** With 16 images and a 4-image test split
containing a single BAD sample, variance is enormous; the class-1 recall of 0.0 shows
the model has not learned the poor-yield class yet. Treat this as proof that the
pipeline runs end-to-end, and collect a few hundred labelled images per class before
trusting predictions in the field. The same warning is stored in
`training_metrics.json → warnings`.

---

## 7. Yield Regressor Training

No numeric-yield dataset exists in this repository, so the script **refuses to train
and exits with code 2** unless real data is supplied:

```bash
# Real measured yields (writes models/yield_model.pkl → API switches to trained:true,
# method:"regressor", modelVersion:"mangosense-yield-v1")
venv\Scripts\python.exe training/train_yield_regressor.py --data-csv path/to/yields.csv \
    --target yield_tonnes_per_acre

# Synthetic data for pipeline testing ONLY (writes models/yield_model_synthetic.pkl
# with synthetic:true — the API never loads it)
venv\Scripts\python.exe training/train_yield_regressor.py --allow-synthetic
```

CSV format: one row per sample, numeric feature columns (e.g. the 576-d CNN feature
block + climate columns) plus a numeric target column. RF / GBR / SVR are compared by
MAE / RMSE / R² and the best is saved with its metrics and `feature_dim`.

Until that file exists, `/predict/yield` computes the range from the **real request
inputs** (bud health = P(GOOD)·100, temperature, humidity, rainfall, wind, soil
moisture, variety, plot acres) and discloses this via
`trained: false, method: "rule_based_pending_yield_dataset"`.

---

## 8. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Device, checkpoint status (`cnn_weights_loaded`, `cnn_is_demo`, `yield_model_loaded`) |
| `POST` | `/predict/bud` | Multipart batch: quality gate + binary CNN classification |
| `POST` | `/predict/yield` | Yield range (rule-based pending a numeric-yield dataset) |
| `POST` | `/predict/full` | Bud analysis + CNN-feature fusion + yield range |

Response shapes follow `CONTRACT.md §2`. Key honesty guarantees:

* `summary.overallHealthScore` = round(mean P(GOOD) × 100) and
  `summary.confidenceScore` = mean per-image confidence — computed from real model
  outputs on every request, never constants.
* Quality-failed / disallowed-extension images go to `errors` (HTTP 200, never a 500).
* `is_demo: true` only when no CNN checkpoint is loaded (then probabilities are
  uniform 50/50 placeholders with an explanatory note — not fake confident numbers).
* No bud counts or bounding boxes are ever emitted (contract §0).
