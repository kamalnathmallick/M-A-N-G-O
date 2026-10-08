import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { connectDB, getDBStatus } from './config/db.js';
import { seedDatabase } from './services/seedService.js';
import { mlClientService } from './services/mlClientService.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import mlRoutes from './routes/mlRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration — honours CORS_ORIGIN (comma-separated allow-list) plus
// explicit localhost dev origins. Unknown origins are BLOCKED (no allow-all).
const allowedOrigins = [
  ...env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Origin not on the allow-list: no CORS headers -> browser blocks it
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Logging (skip in automated test runs: NODE_ENV=test or a *.test.js entry file —
// ESM import hoisting means NODE_ENV may not be set yet when this module loads)
const isTestRun =
  env.NODE_ENV === 'test' || /\.test\.(js|mjs|cjs)$/i.test(process.argv[1] || '');
if (!isTestRun) {
  app.use(morgan('dev'));
}

// Static files for uploaded images
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = getDBStatus();
  const mlStatus = await mlClientService.checkHealth();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MangoSense MEAN Backend',
    database: dbStatus,
    mlService: mlStatus
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/ml', mlRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

/**
 * Probe whether something already listening on PORT is the MangoSense backend.
 * Returns 'mangosense' | 'other' | 'unreachable'.
 */
const probeExistingServer = (port) =>
  new Promise((resolve) => {
    const req = http.get(
      { hostname: 'localhost', port, path: '/api/health', timeout: 2000 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json && json.service === 'MangoSense MEAN Backend' ? 'mangosense' : 'other');
          } catch {
            resolve('other');
          }
        });
      }
    );
    req.on('error', () => resolve('unreachable'));
    req.on('timeout', () => { req.destroy(); resolve('unreachable'); });
  });

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`[MangoSense Backend] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Handle port conflicts cleanly so nodemon does not enter a crash-restart loop.
    // - EADDRINUSE + healthy MangoSense already there → exit(0) (clean stop, nodemon won't restart)
    // - EADDRINUSE + unknown process                  → exit(1) with diagnostic (nodemon waits for file change)
    // - Any other server error                        → exit(1) with full details
    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        const who = await probeExistingServer(env.PORT);
        if (who === 'mangosense') {
          console.log(
            `\n[MangoSense Backend] Already running on port ${env.PORT} — no second server needed.\n` +
            `  The existing backend is healthy. This process will exit cleanly.\n` +
            `  If you want to restart, stop the existing process first:\n` +
            `      Windows:  netstat -ano | findstr :${env.PORT}   then   Stop-Process -Id <PID>\n` +
            `      Linux/Mac: lsof -ti :${env.PORT} | xargs kill\n`
          );
          process.exit(0); // clean exit — nodemon will NOT restart on exit code 0
        } else {
          console.error(
            `\n[MangoSense Backend] ERROR: Port ${env.PORT} is already in use by another application.\n` +
            `  Identify and stop that process, then run 'npm run dev' again:\n` +
            `      Windows:  netstat -ano | findstr :${env.PORT}\n` +
            `      Linux/Mac: lsof -i :${env.PORT}\n` +
            `  Do NOT change the port — the frontend expects the backend on port ${env.PORT}.\n`
          );
          process.exit(1);
        }
      } else {
        console.error('[MangoSense Backend] Server error:', err);
        process.exit(1);
      }
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const isDirectExecution = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server'));

if (isDirectExecution && !isTestRun) {
  startServer();
}

export { app, startServer };
export default app;
