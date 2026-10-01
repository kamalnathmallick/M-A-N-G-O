import express from 'express';
import { getCurrentWeather, get15DayForecast, getClimateSummary } from '../controllers/weatherController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/current', protect, getCurrentWeather);
router.get('/forecast', protect, get15DayForecast);
router.get('/summary', protect, getClimateSummary);

export default router;
