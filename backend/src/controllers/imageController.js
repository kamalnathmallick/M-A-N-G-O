import mongoose from 'mongoose';
import { Image } from '../models/Image.js';
import { successResponse } from '../utils/apiResponse.js';

const dbReady = () => mongoose.connection.readyState === 1;

/**
 * GET /api/images?farmId=  (auth-protected)
 * Returns `data: { images: [...] }` — Image metadata only, scoped to the
 * authenticated user (and farmId when supplied).
 * Offline (MongoDB down): honestly returns an empty list.
 */
export const getImages = async (req, res, next) => {
  try {
    const { farmId = null, plotId = null } = req.query;

    let images = [];
    if (dbReady()) {
      try {
        const filter = { userId: req.user._id ?? req.user.id };
        if (farmId) filter.farmId = farmId;
        if (plotId) filter.plotId = plotId;
        images = await Image.find(filter).sort({ createdAt: -1 }).limit(100).lean();
      } catch (err) {
        console.warn('[imageController] DB read failed:', err.message);
      }
    }

    return successResponse(
      res,
      {
        images: images.map((img) => ({
          ...img,
          id: img._id ? img._id.toString() : img.id
        }))
      },
      images.length > 0 ? 'Images retrieved' : 'No stored images for this user'
    );
  } catch (error) {
    next(error);
  }
};
