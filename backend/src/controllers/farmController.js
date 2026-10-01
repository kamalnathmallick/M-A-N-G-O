import mongoose from 'mongoose';
import { Farm } from '../models/Farm.js';
import { INITIAL_FARMS } from '../services/seedService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const dbReady = () => mongoose.connection.readyState === 1;
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Demo farms (in-memory fallback data) always carry isDemo: true. */
const demoFarms = () =>
  INITIAL_FARMS.map((f, i) => ({
    ...f,
    id: `farm-${i + 1}`,
    _id: `farm-${i + 1}`,
    isDemo: true
  }));

const demoFarmById = (id) => {
  const index = ['farm-1', 'farm-2', 'farm-3'].indexOf(id);
  return index >= 0 && INITIAL_FARMS[index] ? { ...demoFarms()[index] } : null;
};

const toClientFarm = (farm) => ({
  ...farm,
  id: farm._id ? farm._id.toString() : farm.id,
  isDemo: farm.isDemo === true
});

/** True when the requesting user may READ this farm (unowned = shared demo data). */
const ownsFarm = (farm, user) => {
  if (!user) return false;
  if (!farm.userId) return true; // shared demo/seed farm
  return farm.userId.toString() === user.id;
};

/** True when the requesting user may MUTATE this farm (exact owner only). */
const canMutateFarm = (farm, user) => {
  if (!user || !farm.userId) return false; // unowned demo data is read-only
  return farm.userId.toString() === user.id;
};

/**
 * Whitelist for PUT /farms/:id — mass-assignment protection (contract §3).
 * Only these keys are ever written from req.body.
 */
const UPDATABLE_FIELDS = ['name', 'location', 'totalArea', 'establishedYear', 'soilType', 'irrigationType', 'plots', 'season'];

export const getFarms = async (req, res, next) => {
  try {
    // Reads fall back to demo data (isDemo: true) when Mongo is offline.
    if (dbReady()) {
      try {
        const userId = req.user._id ?? req.user.id;
        const farms = await Farm.find({ userId }).lean();
        if (farms && farms.length > 0) {
          return successResponse(res, farms.map(toClientFarm), 'Farms retrieved successfully');
        }
      } catch (err) {
        console.warn('[farmController] DB read failed, serving demo farms:', err.message);
      }
    }
    return successResponse(res, demoFarms(), 'Demo farms (no stored farms for this user)');
  } catch (error) {
    next(error);
  }
};

export const getFarmById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (dbReady() && isValidObjectId(id)) {
      try {
        const farm = await Farm.findById(id).lean();
        if (farm) {
          if (!ownsFarm(farm, req.user)) {
            return errorResponse(res, 'You do not have access to this farm', null, 403);
          }
          return successResponse(res, toClientFarm(farm), 'Farm retrieved');
        }
        // Unknown ObjectId -> 404 (never silently serve a demo farm)
        return errorResponse(res, 'Farm not found', null, 404);
      } catch (err) {
        console.warn('[farmController] DB read failed:', err.message);
      }
    }

    // Demo fallback ids (farm-1 …) only resolve to the demo dataset.
    const demo = demoFarmById(id);
    if (demo) {
      return successResponse(res, demo, 'Demo farm retrieved (isDemo: true)');
    }
    return errorResponse(res, 'Farm not found', null, 404);
  } catch (error) {
    next(error);
  }
};

export const createFarm = async (req, res, next) => {
  try {
    const { name, location, totalArea, establishedYear, soilType, irrigationType, plots, season } = req.body;

    if (!name || !location || typeof name !== 'string' || typeof location !== 'string') {
      return errorResponse(res, 'Farm name and location are required', null, 400);
    }

    // Writes require a real database — never fake persistence.
    if (!dbReady()) {
      return errorResponse(
        res,
        'Database unavailable — farm cannot be created. Please retry when MongoDB is reachable.',
        null,
        503
      );
    }

    const farm = await Farm.create({
      userId: req.user._id ?? req.user.id,
      name,
      location,
      totalArea: totalArea || '10.0 acres',
      establishedYear: establishedYear || new Date().getFullYear(),
      soilType: soilType || 'Laterite Red Loam',
      irrigationType: irrigationType || 'Drip Micro-irrigation',
      season: typeof season === 'string' ? season : '',
      isDemo: false,
      plots: plots || [
        {
          id: 'plot-a',
          name: 'Plot A — 2.5 acres',
          variety: 'Alphonso (Hapus)',
          treeCount: 150,
          treeAge: '6 Years',
          floweringStage: 'Panicle Elongation & Bloom',
          healthScore: 80,
          expectedYield: '4.8 – 5.4',
          yieldUnit: 'tonnes/acre',
          flowerDropRisk: 'Low – Moderate',
          climateRisk: 'Low'
        }
      ]
    });
    return successResponse(res, { ...farm.toObject(), id: farm._id.toString() }, 'Farm created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateFarm = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!dbReady()) {
      return errorResponse(res, 'Database unavailable — farm cannot be updated.', null, 503);
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Farm not found', null, 404);
    }

    const farm = await Farm.findById(id).lean();
    if (!farm) {
      return errorResponse(res, 'Farm not found', null, 404);
    }
    if (!canMutateFarm(farm, req.user)) {
      return errorResponse(res, 'You do not have access to this farm', null, 403);
    }

    // Whitelist: ignore any field not explicitly editable (no mass assignment)
    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Farm.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!updated) {
      return errorResponse(res, 'Farm not found', null, 404);
    }
    return successResponse(res, { ...updated.toObject(), id: updated._id.toString() }, 'Farm updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteFarm = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!dbReady()) {
      return errorResponse(res, 'Database unavailable — farm cannot be deleted.', null, 503);
    }
    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Farm not found', null, 404);
    }

    const farm = await Farm.findById(id).lean();
    if (!farm) {
      return errorResponse(res, 'Farm not found', null, 404);
    }
    if (!canMutateFarm(farm, req.user)) {
      return errorResponse(res, 'You do not have access to this farm', null, 403);
    }

    await Farm.findByIdAndDelete(id);
    return successResponse(res, { id }, 'Farm deleted successfully');
  } catch (error) {
    next(error);
  }
};
