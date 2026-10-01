# MangoSense MEAN Backend 🥭⚙️

The backend service for **MangoSense**, built with the **MEAN** stack (MongoDB, Express.js, Node.js with the existing React frontend retained as the presentation layer).

> **Architectural Note:** The project retains the existing React frontend instead of replacing it with Angular, because the frontend was already implemented and the requirement is to integrate the backend without changing the existing UI.

---

## 1. Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & bcryptjs
- **File Uploads**: Multer with file type and size validation
- **ML Integration**: HTTP communication via Axios with Python FastAPI service (`http://localhost:8000`)
- **Resilience**: Zero-crash graceful fallback for offline database or ML service operations

---

## 2. Directory Structure

```text
backend/
├── src/
│   ├── config/          # db.js, env.js, recommendationRules.js (threshold-based rule config)
│   ├── controllers/     # auth, farm, prediction, weather, history, dashboard, recommendation, user, image
│   ├── middleware/      # authMiddleware, uploadMiddleware, errorMiddleware
│   ├── models/          # User, Farm, Image, Prediction, Weather, Recommendation, HistoryRecord
│   ├── routes/          # Express REST routes (incl. users, images)
│   ├── services/        # mlClientService, weatherService, weatherProviders, recommendationService, seedService, offlineAuthStore
│   ├── utils/           # apiResponse
│   └── server.js        # Express app entry point
├── uploads/             # Multipart image storage
├── .env.example
├── package.json
└── README.md
```

---

## 3. Environment Variables

Create `.env` based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/mangosense
JWT_SECRET=mangosense_jwt_secret_dev_key_2026_xyz
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760

# Weather provider: 'mock' (offline demo, always isDemo: true) or
# 'openmeteo' (live keyless API, isDemo: false on success)
WEATHER_PROVIDER=mock
OPENMETEO_LATITUDE=16.25
OPENMETEO_LONGITUDE=73.38
OPENMETEO_LOCATION_NAME=Open-Meteo (farm coordinates)
```

Notes:
- `JWT_SECRET` is **required in production** — the server fails fast without it.
  In development an insecure fallback is allowed only with a loud console warning.
- `CORS_ORIGIN` is a comma-separated allow-list (plus explicit localhost dev
  origins); unknown origins receive no CORS headers (no allow-all bypass).
- The `season` field is accepted on farms, bud predictions and history records.

---

## 4. REST API Endpoints

> Data endpoints require `Authorization: Bearer <token>`; only register, login
> and `GET /api/health` are public. Writes return **503** when MongoDB is
> offline (never fake success); reads fall back to demo data flagged
> `isDemo: true`.

### Authentication
- `POST /api/auth/register` — Register a new farmer account
- `POST /api/auth/login` — Login & receive JWT token
- `GET /api/auth/me` — Get authenticated farmer profile

### Users & Images
- `GET /api/users` and `GET /api/users/me` — Current user (`data: { user }`)
- `GET /api/images?farmId=...&plotId=...` — Image metadata for the signed-in user (`data: { images: [...] }`)

### Farms & Plots
- `GET /api/farms` — List the signed-in user's farms with plot metadata
- `GET /api/farms/:id` — Get single farm by ID (ownership-checked; unknown id → 404)
- `POST /api/farms` — Create new farm/plot (accepts `season`)
- `PUT /api/farms/:id` — Update farm details (whitelisted fields only)
- `DELETE /api/farms/:id` — Delete farm

### Predictions & Bud Uploads
- `POST /api/predictions/bud` — Multipart upload of up to 10 bud images (`images[]`, `farmId`, `plotId`, `variety`, `floweringStage`, `canopyDirection`, `season`); zero files → 400
- `GET /api/predictions/latest?plotId=...` — Get latest yield and bud health prediction (scoped to the signed-in user)
- `POST /api/predictions/simulate` — Dynamic what-if sensitivity calculator

### Climate & Weather
- `GET /api/weather/current?farmId=...` — Current microclimate telemetry (+ `isDemo`)
- `GET /api/weather/forecast?farmId=...` — 15-day agronomic forecast (every entry carries `isDemo`)
- `GET /api/weather/summary?farmId=...` — Flower-drop weather risk summary (+ `isDemo`)

### History & Recommendations
- `GET /api/history` — Historical analysis timeline for the signed-in user
- `GET /api/history/:id` — Detailed historical record (ownership-checked)
- `POST /api/history` — Create new history record (validated + whitelisted fields)
- `GET /api/recommendations` — Rule-based recommendations from the latest prediction + weather
- `GET /api/dashboard` — Aggregated metrics for farmer dashboard

### Recommendation rules
`src/config/recommendationRules.js` exports `THRESHOLDS` and
`RECOMMENDATION_RULES` (`IF <metric> <op> <threshold> THEN <recommendation>`).
`src/services/recommendationService.js` evaluates them against the latest
prediction and the 15-day forecast; the DB seed is used only as an
`isDemo: true` fallback.

---

## 5. Development & Testing Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit & API integration tests
npm test
```
