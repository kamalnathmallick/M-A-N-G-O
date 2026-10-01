import express from 'express';
import { analyzeBudBatch, getLatestPrediction, simulateSensitivity } from '../controllers/predictionController.js';
import { uploadBudImages } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multipart bud images upload and ML inference (images[1..10])
router.post('/bud', protect, uploadBudImages.array('images', 10), analyzeBudBatch);

// Latest prediction (scoped to the authenticated user)
router.get('/latest', protect, getLatestPrediction);

// Sensitivity What-If simulator
router.post('/simulate', protect, simulateSensitivity);

export default router;
