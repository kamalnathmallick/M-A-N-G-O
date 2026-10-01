import mongoose from 'mongoose';
import { Farm } from '../models/Farm.js';
import { weatherService } from '../services/weatherService.js';
import { recommendationService } from '../services/recommendationService.js';
import { HistoryRecord } from '../models/HistoryRecord.js';
import { INITIAL_FARMS, INITIAL_HISTORY } from '../services/seedService.js';
import { successResponse } from '../utils/apiResponse.js';

const dbReady = () => mongoose.connection.readyState === 1;

export const getDashboardData = async (req, res, next) => {
  try {
    const { farmId = 'farm-1', plotId = 'plot-a' } = req.query;

    // 1. Get farm and plot details (scoped to the authenticated user)
    let farms = [];
    if (dbReady()) {
      try {
        farms = await Farm.find({ userId: req.user._id ?? req.user.id }).lean();
      } catch (err) {
        // Fallback
      }
    }
    if (!farms || farms.length === 0) farms = INITIAL_FARMS;

    const farm = farms.find((f) => (f._id && f._id.toString() === farmId) || f.id === farmId) || farms[0];
    const plot = farm?.plots?.find((p) => p.id === plotId) || farm?.plots?.[0];

    // 2. Weather (live or flagged demo — see weatherService)
    const weather = await weatherService.getCurrentWeather(farmId);
    const forecast = await weatherService.get15DayForecast(farmId);

    // 3. Rule-based recommendations
    const recommendations = await recommendationService.getRecommendations({
      farmId,
      plotId,
      userId: req.user._id
    });

    // 4. Recent analyses / history (scoped to the authenticated user)
    let history = [];
    if (dbReady()) {
      try {
        history = await HistoryRecord.find({ userId: req.user._id ?? req.user.id }).sort({ createdAt: -1 }).limit(5).lean();
      } catch (err) {
        // Fallback
      }
    }
    if (!history || history.length === 0) {
      history = INITIAL_HISTORY.map((h, i) => ({ ...h, id: h.id || `hist-${i + 1}` }));
    }

    return successResponse(
      res,
      {
        selectedFarm: farmId,
        selectedPlot: plotId,
        farmSummary: {
          name: farm.name,
          location: farm.location,
          plotName: plot?.name || 'Plot A — 2.5 acres',
          variety: plot?.variety || 'Alphonso (Hapus)',
          treeAge: plot?.treeAge || '7 Years',
          treeCount: plot?.treeCount || 180,
          expectedYield: plot?.expectedYield || '4.8 – 5.4',
          yieldUnit: plot?.yieldUnit || 'tonnes/acre',
          healthScore: plot?.healthScore || 78,
          flowerDropRisk: plot?.flowerDropRisk || 'Moderate',
          climateRisk: plot?.climateRisk || 'Low – Moderate'
        },
        weather,
        forecast,
        topRecommendations: recommendations.slice(0, 3),
        recentAnalyses: history.slice(0, 5)
      },
      'Dashboard overview data retrieved'
    );
  } catch (error) {
    next(error);
  }
};
