import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
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

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`[MangoSense Backend] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
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
