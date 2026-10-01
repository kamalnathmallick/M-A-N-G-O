import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

// ---------------------------------------------------------------------------
// JWT secret handling
//   - production: FAIL FAST when JWT_SECRET is unset (never ship a default secret)
//   - development/test: an insecure dev fallback is allowed, but only with a
//     loud, impossible-to-miss warning.
// ---------------------------------------------------------------------------
const DEV_FALLBACK_JWT_SECRET = 'mangosense_jwt_secret_dev_key_2026_xyz';

const rawJwtSecret = process.env.JWT_SECRET;

if (!rawJwtSecret) {
  if (NODE_ENV === 'production') {
    throw new Error(
      '[MangoSense] FATAL: JWT_SECRET is not set. Refusing to start in production mode without a real secret. ' +
        'Set JWT_SECRET in backend/.env before starting the server.'
    );
  }
  console.warn(
    '********************************************************************************************\n' +
      '* [MangoSense WARNING] JWT_SECRET is not set — using an INSECURE development-only fallback. *\n' +
      '* Anyone who knows this default value can forge valid tokens.                               *\n' +
      '* Set JWT_SECRET in backend/.env for anything beyond local development.                      *\n' +
      '********************************************************************************************'
  );
}

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mangosense',
  JWT_SECRET: rawJwtSecret || DEV_FALLBACK_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB

  // Weather provider selection: 'mock' (offline/demo data) or 'openmeteo' (live, keyless)
  WEATHER_PROVIDER: (process.env.WEATHER_PROVIDER || 'mock').toLowerCase(),
  // Coordinates + label used by the Open-Meteo provider
  OPENMETEO_LATITUDE: parseFloat(process.env.OPENMETEO_LATITUDE) || 16.25, // Ratnagiri, Maharashtra
  OPENMETEO_LONGITUDE: parseFloat(process.env.OPENMETEO_LONGITUDE) || 73.38,
  OPENMETEO_LOCATION_NAME: process.env.OPENMETEO_LOCATION_NAME || 'Open-Meteo (farm coordinates)'
};
