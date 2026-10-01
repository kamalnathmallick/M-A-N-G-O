# MangoSense Integration Contract (authoritative)

All three layers (ml/, backend/, frontend/) MUST conform to this file. Do not invent other shapes.

## 0. Dataset (source of truth)

- Location: `ml/dataset/raw/GOOD/` (10 files), `ml/dataset/raw/BAD/` (6 files)
- Format: `.jpeg`, 1200x1600 / 1600x1200, no duplicates
- Labels: **binary** `GOOD` -> class index 0, `BAD` -> class index 1
- Display labels: `Good Yield Potential` (0), `Poor Yield Potential` (1)
- Status values emitted by ML: `healthy` (GOOD), `poor_yield` (BAD), `rejected` (quality failure)
- No bounding boxes / bud counts exist in this dataset => **NEVER emit fabricated
  `detectedBuds`, `healthyBuds`, `affectedBuds`, or `boxes`.** Omit these keys entirely.

## 1. Envelope (backend -> frontend)

Success: `{ "success": true, "data": <payload>, "message": "..." }`
Error:   `{ "success": false, "message": "...", "error": "..." }`
`apiClient.js` unwraps `data`. Never leak stack traces.

## 2. ML service (port 8000) -> backend

The backend flattens: controller code reads `mlResult.summary`, `mlResult.images`
directly. Therefore `mlClientService` MUST return `response.data` (flattened), NOT
`{ data: response.data }`.

### POST /predict/bud  (multipart: images[], farmId, plotId, variety, floweringStage, canopyDirection, season)
```json
{
  "success": true,
  "is_demo": false,
  "modelVersion": "mangosense-cnn-v1",
  "summary": {
    "totalImagesAnalyzed": 4,
    "overallHealthScore": 72,
    "goodYieldCount": 3,
    "poorYieldCount": 1,
    "rejectedCount": 0,
    "confidenceScore": 84.5,
    "flowerDropRisk": "Low|Moderate|High",
    "distribution": { "goodPercentage": 75, "poorPercentage": 25, "goodRatio": 75, "poorRatio": 25 }
  },
  "images": [ {
    "id": "img-1", "filename": "a.jpg", "title": "a.jpg", "stage": "...",
    "classification": "Good Yield Potential",
    "confidence": 91.4,
    "status": "healthy",
    "risk": { "goodYield": 0.914, "poorYield": 0.086 },
    "notes": "...",
    "quality": { "is_valid": true, "blur_score": 145.2, "brightness": 118.0, "width": 1600, "height": 1200 },
    "model_version": "mangosense-cnn-v1"
  } ],
  "errors": [ { "filename": "blurry.jpg", "message": "Image quality is too low for reliable prediction." } ]
}
```
- `overallHealthScore` = round(mean P(GOOD) * 100)  [real, from model]
- `confidenceScore` = round(mean confidence * 10, one decimal) [real]
- Quality-failed images go to `errors`, NOT `images`. Must never 500 (fix KeyError).
- `is_demo: true` ONLY when no trained checkpoint is loaded.

### POST /predict/yield  (JSON: budHealth, variety, temperature, humidity, rainfall, windSpeed, vaporPressureDeficit, soilMoisture, plotAcres, cnnFeatures)
Flattened response:
```json
{
  "success": true, "isDemo": false, "trained": false,
  "method": "rule_based_pending_yield_dataset",
  "modelVersion": "mangosense-yield-rule-v1",
  "expectedYieldMin": 4.5, "expectedYieldMax": 5.1, "expectedYieldAverage": 4.8,
  "yieldUnit": "tonnes / acre",
  "totalPlotExpectedMin": 11.3, "totalPlotExpectedMax": 12.8,
  "totalPlotUnit": "tonnes total",
  "dropRisk": "Low"
}
```
- Yield range MUST be derived from real inputs (P(GOOD) via budHealth + climate), never constants.
- `trained: false` + `method` disclose that no numeric-yield dataset exists yet.
- When a real `yield_model.pkl` trained on a numeric-yield CSV exists: `trained: true`,
  `method: "regressor"`, `modelVersion: "mangosense-yield-v1"`, same keys.
- `train_yield_regressor.py` REFUSES to train without a numeric-yield CSV unless
  `--allow-synthetic` is passed; synthetic bundles are saved as
  `yield_model_synthetic.pkl` and flagged `synthetic: true` (never loaded by fusion).

## 3. Backend (5000) -> frontend. Base: `VITE_API_BASE_URL=http://localhost:5000/api`

### Auth (Bearer token, localStorage key `mangosense_token`)
- `POST /auth/register` {name,email,password} -> `data: { token, user }`
- `POST /auth/login` {email,password} -> `data: { token, user }`
- `GET /auth/me` -> `data: { user }`
- Passwords bcrypt-hashed only.

### Farms  (`protect` + ownership check on :id)
- `GET /farms` -> `data: Farm[]` where Farm = `{ id, name, location, totalArea, soilType,
  irrigationType, establishedYear, plots: [ { id, name, variety, treeCount, treeAge,
  floweringStage, healthScore, expectedYield, yieldUnit, flowerDropRisk, climateRisk } ] }`
  (must match `MOCK_FARMS` shape in `mockFarmService.js` — frontend keeps rendering it as-is.
  `id` must be a string usable in URLs.)
- `POST/PUT/DELETE /farms` standard; `PUT` only whitelisted fields (no mass assignment).

### Predictions
- `POST /predictions/bud` multipart `images[1..10]`, `farmId`, `plotId`, `variety`,
  `floweringStage`, `canopyDirection`, `season` -> `data` = the ML `/predict/bud`
  response body PLUS `{ isDemo, fromMLService, predictionId, modelVersion: { budModel, yieldModel } }`
  - If NO files are attached: return `400 {success:false, message:"At least one image is required."}`
    (no fabricated sample analysis).
  - Persist `Image` docs (metadata+path only) and one `Prediction` doc per upload.
- `GET /predictions/latest?plotId=` -> `data` shaped like `MOCK_LATEST` in
  `mockPredictionService.js` (keys: expectedYieldMin/Max/Average, yieldUnit, budHealth,
  flowerDropRisk, climateRisk, factors{budHealth,climate,flowerDropRisk,pestRisk}, isDemo).
- `POST /predictions/simulate` {budHealth, rainfallIntensity, pestControlActive, variety, plotAcres}
  -> `data` = flattened `/predict/yield` response (keys listed in §2).

### Weather
- `GET /weather/current?farmId=` -> `data` = CURRENT_WEATHER shape + `isDemo`
- `GET /weather/forecast?farmId=` -> `data` = 15-day array; MUST include `isDemo: true`
  on each fallback entry (currently unmarked).
- `GET /weather/summary?farmId=` -> `data` + `isDemo`

### History  (all scoped to authenticated user; `protect`)
- `GET /history` -> `data: HistoryRecord[]` matching `MOCK_HISTORY_RECORDS` keys in
  `mockHistoryService.js`: `{ id, date, plot, plotDetails, budHealth, flowerDropRisk,
  climateCondition, predictedYield, totalTonnes, sampleCount, keyObservation, isDemo }`
- `GET /history/:id`, `POST /history` (validated, no raw body spread)
- Record per prediction: userId, farmId, season, imageIds, classification, confidence,
  risk values, climate features, structured numeric yield, `modelVersion {budModel,yieldModel}`.

### Recommendations (rule-based, configurable)
- `GET /recommendations?farmId=` -> `data: Recommendation[]` matching
  `MOCK_RECOMMENDATIONS` keys in `mockRecommendationService.js`.
- Rules live in `backend/src/config/recommendationRules.js`: `IF <metric> <op> <threshold>
  THEN <recommendation>` with thresholds exported for tests. Generated from the latest
  prediction + weather; DB seed used only as `isDemo: true` fallback.

### Dashboard
- `GET /dashboard` -> `data` used by `App.jsx` to feed DashboardView props
  (stat cards, latest analysis, weather, recommendations, recent analyses).

### Required routers (currently missing)
- `GET /users/me`-style extras NOT required; but `GET /images?farmId=` and
  `GET /users` (admin/self) MUST exist per spec: minimal, auth-protected,
  `data: { images: [...] }` / `data: { user }`.

### Security (backend-wide)
- `protect` on ALL data routes; ownership check `farm.userId.toString() === req.user.id`.
- CORS honours `CORS_ORIGIN` (no allow-all bypass).
- Indexes: `userId` on Prediction/Image/HistoryRecord, `createdAt` on HistoryRecord.
- `season` field added to Farm, Image, Prediction, HistoryRecord.
- `form-data` added to package.json.

## 4. Frontend changes (minimal, no redesign)

- Views currently reading `MOCK_*` constants directly MUST call the service instead:
  `HistoryView.jsx`, `RecommendationsView.jsx`, `MyFarmsView.jsx`, `YieldPredictionView.jsx`.
- `App.jsx` passes loaded `history` / `recommendations` into those views.
- What-If simulator calls `POST /predictions/simulate` via `mockPredictionService`
  (rename method `simulateWhatIf`), keeping identical UI.
- New auth: `src/context/AuthContext.jsx` + `components/auth/LoginView.jsx` (login/register
  toggle). Writes `localStorage.mangosense_token`. TopBar profile shows real user.
- `ImageAnalysisView` switches 4-category donut/legend to binary while keeping the EXACT
  card layout, colors, spacing: rows = Good Yield Potential %, Poor Yield Potential %,
  Avg Model Confidence %, Image Quality Pass % (4 rows preserved). Filters: ALL / GOOD / POOR.
  Remove bud-count text (`Detected: X buds`) -> show quality score instead.
- Binary labels only where class names appear; all styling/layout/charts untouched.
- Render `isDemo` truthfully: replace hardcoded "Prototype" badges with data-driven badge
  (`isDemo ? "Demo Data" : "Live Model Result"`), no layout change.
- Add loading + error states (spinner/text in existing containers, no redesign).
- Wizard: add canopy-direction select (North/South/East/West) + season input; append
  `farmId, plotId, canopyDirection, season` to the FormData.
- No hardcoded backend URLs outside `apiClient.js`.
