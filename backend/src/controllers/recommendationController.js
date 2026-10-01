import { recommendationService } from '../services/recommendationService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const { farmId = 'farm-1', plotId = 'plot-a', predictionId = null } = req.query;
    const recommendations = await recommendationService.getRecommendations({
      farmId,
      plotId,
      predictionId,
      userId: req.user._id ?? req.user.id
    });
    return successResponse(res, recommendations, 'Recommendations retrieved');
  } catch (error) {
    next(error);
  }
};
