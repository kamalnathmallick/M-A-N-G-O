import { mlClientService } from '../services/mlClientService.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * GET /api/ml/info — model card + last recorded evaluation.
 * Public (no auth): model metadata contains no user data, and the Research
 * page must render an honest state even in demo mode where no token exists.
 * When the ML service is offline we return { available:false } with HTTP 200
 * so the frontend can say "Unavailable" instead of showing stale numbers.
 */
export const getMlModelInfo = async (req, res, next) => {
  try {
    const result = await mlClientService.getModelInfo();
    if (!result.available) {
      return successResponse(
        res,
        { available: false, reason: 'ML service is offline.' },
        'ML service unavailable — model info not available.'
      );
    }
    return successResponse(
      res,
      { available: true, info: result.info },
      'Model info retrieved.'
    );
  } catch (err) {
    next(err);
  }
};
