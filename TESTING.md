# MangoSense — How to Test the Model

Every command below was actually run on this machine. Pick the level that matches what you want to check.

---

## 0. Start the services (needed for levels 2–5)

Open **4 terminals** in the project root `C:\Users\kamal\Downloads\VS_WEB\MangoSense`:

| # | Terminal | Command |
|---|----------|---------|
| 1 | MongoDB | `npm run start:mongo` (project root; downloads a mongod binary on first run) |
| 2 | ML service | `npm run start:ml` |
| 3 | Backend | `npm run start:backend` |
| 4 | Frontend | `npm run start:frontend` |

> Add `$env:PATH="C:\Program Files\nodejs;$env:PATH"` first if `npm`/`node` are not on your PATH.
> Node is installed at `C:\Program Files\nodejs` on this machine but is not added to PATH.

Sanity check — all three must answer:

```powershell
curl.exe -s http://localhost:8000/health     # ML: cnn_weights_loaded must be true
curl.exe -s http://localhost:5000/api/health # Backend: database.isConnected + mlService.online
# then open http://localhost:5173
```

If MongoDB is skipped, everything still runs — but data is demo data and the UI will say **"Demo Data"**.

---

## 1. Offline model evaluation (the most important test)

Runs the trained checkpoint once on the **held-out test split** it never trained on.

```powershell
cd C:\Users\kamal\Downloads\VS_WEB\MangoSense\ml
.\venv\Scripts\python.exe evaluation/evaluate.py
# same thing from the project root:  npm run test:ml-eval
```

What you should see (real output from the last run):

```
Loss 0.4591 | Accuracy 0.750 | Precision(macro) 0.375 | Recall(macro) 0.500 | F1(macro) 0.429

Confusion matrix (rows=true, cols=pred):
[[3 0]
 [1 0]]

Good Yield Potential       0.75      1.00      0.86         3
Poor Yield Potential       0.00      0.00      0.00         1
```

A full report is saved to `ml/models/evaluation_report.json`.

> **Honest reading of these numbers:** 75% accuracy is from only 4 test images. The model
> currently finds all GOOD images but misses the single BAD one (recall 0.0 for the BAD class).
> Treat this as proof the pipeline works, **not** as a field-ready accuracy claim.

---

## 2. Test the ML service directly (single command, no backend needed)

```powershell
$raw="C:\Users\kamal\Downloads\VS_WEB\MangoSense\ml\dataset\raw"
$g=(Get-ChildItem "$raw\GOOD" -Filter *.jpeg | Select-Object -First 1).FullName
$b=(Get-ChildItem "$raw\BAD"  -Filter *.jpeg | Select-Object -First 1).FullName

curl.exe -s -X POST http://localhost:8000/predict/bud -F "images=@$g" -F "images=@$b"
```

Real response:

```json
{"summary":{"totalImagesAnalyzed":2,"overallHealthScore":50,"goodYieldCount":1,
 "poorYieldCount":1,"confidenceScore":55.2,"flowerDropRisk":"High", ...},
 "images":[{"classification":"Good Yield Potential","confidence":55.2,...}, ...]}
```

**How to judge it:**
- `is_demo` must be `false` when `cnn_weights_loaded: true` — a `true` here means it used the fallback, not your model.
- Confidence values must **vary between images and between runs with different images** — a constant (e.g. always 91.2) would mean fabricated data.
- A GOOD image and a BAD image in the same batch should (ideally) get different labels.

### Negative tests (these must NOT crash)

```powershell
# 1) Tiny image -> rejected with a clear message, HTTP 200 (not 500)
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 10,10; $bmp.Save("$env:TEMP\tiny.png"); $bmp.Dispose()
curl.exe -s -X POST http://localhost:8000/predict/bud -F "images=@$env:TEMP\tiny.png"

# 2) Corrupt file -> rejected, not 500
[System.IO.File]::WriteAllBytes("$env:TEMP\corrupt.jpg", [byte[]](1..50))
curl.exe -s -X POST http://localhost:8000/predict/bud -F "images=@$env:TEMP\corrupt.jpg"

# 3) Yield endpoint (rule-based until a numeric-yield dataset exists)
curl.exe -s -X POST http://localhost:8000/predict/yield -H "Content-Type: application/json" `
  -Body '{"budHealth":85,"variety":"Alphonso","temperature":29,"humidity":68,"rainfall":2,"plotAcres":2.5}'
```

Expected: (1) and (2) return `rejectedCount: 1` + a readable `errors[0].message` with **HTTP 200**;
(3) returns a yield range with `"trained": false` and `"method": "rule_based_pending_yield_dataset"` —
that flag is the API telling you honestly that no numeric-yield model exists yet.

---

## 3. Backend test suite (38 tests: auth, ownership, upload, validation, ML-down fallback)

```powershell
cd C:\Users\kamal\Downloads\VS_WEB\MangoSense\backend
$env:PATH="C:\Program Files\nodejs;$env:PATH"
npm test
```

Last run: **`tests 38 / pass 38 / fail 0`** with **MongoDB and the ML service both online**
(the strictest configuration — the suite also passes with both offline).

Covers: register/login/bad-password, 401 without token, **user B blocked from user A's farm**,
farm CRUD, wrong file type → 400, >10 images → 400, zero files → 400, real ML upload,
history persistence, recommendation-rule thresholds, CORS allow-list, no stack-trace leaks.

> These tests generate a **real 128×128 PNG** for uploads (noise that passes the ML quality gate).
> That fixture was fixed — an 8-byte fake JPEG header used to be rejected whenever the ML service
> was online, which is why 3 tests failed in online mode.

---

## 4. Full end-to-end through the browser (what a user actually does)

1. Open `http://localhost:5173` → **Sign in** (or *Create Account*).
   - Local test account: `alpha@test.com` / `Passw0rd!123` (created during verification)
2. Dashboard → badges must read **"Live Model Result"** (4 of them), not "Demo Data".
   - "Demo Data" while MongoDB is on = a bug worth reporting.
3. **New Analysis** → pick farm/plot → upload 1–3 of your `ml/dataset/raw` images →
   choose canopy direction + season → run.
   - You should see `Good Yield Potential` / `Poor Yield Potential` with per-image confidence.
4. **History** → the run must appear there (persisted), `isDemo` false.
5. **Yield Prediction** → move the bud-health slider →
   status should read **"Live backend simulation"** and the range should change
   (e.g. 50% health → 3.6–4.8 t/acre, 92% health → 4.5–5.2 t/acre).
6. **History → Export CSV** → opens a download containing the real records.

---

## 5. Retrain after adding more images

Drop new photos into `ml/dataset/raw/GOOD/` or `ml/dataset/raw/BAD/`, then:

```powershell
cd C:\Users\kamal\Downloads\VS_WEB\MangoSense\ml
.\venv\Scripts\python.exe training/train.py     # saves models/mangosense_cnn.pth + training_metrics.json
.\venv\Scripts\python.exe evaluation/evaluate.py # honest metrics on the held-out split
```

Restart the ML service (level 0, terminal 2) so it loads the new checkpoint.

**Important expectations:**
- With only 16 images the model will stay weak — this is expected and documented, not hidden.
- Group-aware (leak-proof) splitting activates automatically once you add a `metadata.csv`
  with `farm_id`/`tree_id` columns — without it the split is stratified and images from the
  same tree could land on both sides, inflating accuracy.
- `train_yield_regressor.py` **will refuse to run** without a real numeric-yield CSV
  (`--allow-synthetic` exists only for a clearly-flagged throwaway bundle). Real yield numbers
  need a dataset of measured yields — until then the API reports `trained: false`.

---

## Red flags to watch for (spec: never fabricate ML results)

| Flag | Where | What it should say |
|------|-------|--------------------|
| `is_demo` / `isDemo` | ML, backend, UI badges | `false` when weights are loaded and Mongo is up |
| `trained` | `/predict/yield` | `false` until a numeric-yield dataset exists |
| `confidence` | every image | must vary; constants mean fabricated numbers |
| `detectedBuds` / `boxes` | any response | must be **absent** (the dataset has no detections) |
