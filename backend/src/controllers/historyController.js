import mongoose from 'mongoose';
import { HistoryRecord } from '../models/HistoryRecord.js';
import { INITIAL_HISTORY } from '../services/seedService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const dbReady = () => mongoose.connection.readyState === 1;
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Demo fallback records — always flagged isDemo: true and given stable ids. */
const demoRecords = () => INITIAL_HISTORY.map((r, i) => ({ ...r, id: r.id || `hist-${i + 1}`, isDemo: true }));

const toClientRecord = (record) => ({
  ...record,
  id: record._id ? record._id.toString() : record.id,
  isDemo: record.isDemo !== false
});

const ownsRecord = (record, user) => {
  if (!user) return false;
  if (!record.userId) return true; // legacy/demo seed record without owner
  return record.userId.toString() === user.id;
};

/**
 * Whitelist + validation for POST /history — no raw body spread (contract §3).
 * Returns { error } on invalid input, otherwise the sanitized field object.
 */
const validateHistoryBody = (body = {}) => {
  const {
    farmId, farmName, plot, plotDetails, season, date, time,
    budHealth, healthyBudsText, flowerDropRisk, riskBadgeColor, climateCondition,
    predictedYield, totalTonnes, sampleCount, keyObservation,
    classification, confidence, imageIds,
    expectedYieldMin, expectedYieldMax, expectedYieldAverage,
    totalPlotExpectedMin, totalPlotExpectedMax
  } = body;

  if (!date || typeof date !== 'string' || date.trim().length === 0) {
    return { error: 'A record date is required' };
  }
  if (date.length > 64) {
    return { error: 'Record date is too long' };
  }

  const num = (value, { min = -Infinity, max = Infinity, label }) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return { error: `${label} must be a number` };
    if (parsed < min || parsed > max) return { error: `${label} must be between ${min} and ${max}` };
    return parsed;
  };

  const budHealthNum = num(budHealth, { min: 0, max: 100, label: 'budHealth' });
  if (budHealthNum && budHealthNum.error) return budHealthNum;
  const confidenceNum = num(confidence, { min: 0, max: 100, label: 'confidence' });
  if (confidenceNum && confidenceNum.error) return confidenceNum;
  const sampleCountNum = num(sampleCount, { min: 0, max: 1000, label: 'sampleCount' });
  if (sampleCountNum && sampleCountNum.error) return sampleCountNum;
  const yieldMin = num(expectedYieldMin, { min: 0, max: 1000, label: 'expectedYieldMin' });
  if (yieldMin && yieldMin.error) return yieldMin;
  const yieldMax = num(expectedYieldMax, { min: 0, max: 1000, label: 'expectedYieldMax' });
  if (yieldMax && yieldMax.error) return yieldMax;
  const yieldAvg = num(expectedYieldAverage, { min: 0, max: 1000, label: 'expectedYieldAverage' });
  if (yieldAvg && yieldAvg.error) return yieldAvg;

  const str = (value, max = 200) => (typeof value === 'string' ? value.slice(0, max) : undefined);

  const record = {
    farmId: str(farmId, 64) || 'farm-1',
    farmName: str(farmName, 120),
    plot: str(plot, 64),
    plotDetails: str(plotDetails, 160),
    season: str(season, 64),
    date: date.trim().slice(0, 64),
    time: str(time, 32),
    budHealth: budHealthNum ?? undefined,
    healthyBudsText: str(healthyBudsText, 32),
    flowerDropRisk: str(flowerDropRisk, 32),
    riskBadgeColor: str(riskBadgeColor, 16),
    climateCondition: str(climateCondition, 120),
    predictedYield: str(predictedYield, 64),
    totalTonnes: str(totalTonnes, 64),
    sampleCount: sampleCountNum ?? undefined,
    keyObservation: str(keyObservation, 500),
    classification: str(classification, 64),
    confidence: confidenceNum ?? undefined,
    imageIds: Array.isArray(imageIds) ? imageIds.slice(0, 10).map((v) => String(v).slice(0, 64)) : [],
    expectedYieldMin: yieldMin ?? undefined,
    expectedYieldMax: yieldMax ?? undefined,
    expectedYieldAverage: yieldAvg ?? undefined,
    totalPlotExpectedMin: num(totalPlotExpectedMin, { min: 0, max: 1000, label: 'totalPlotExpectedMin' }) ?? undefined,
    totalPlotExpectedMax: num(totalPlotExpectedMax, { min: 0, max: 1000, label: 'totalPlotExpectedMax' }) ?? undefined
  };

  if (record.expectedYieldMin && record.expectedYieldMin.error) return record.expectedYieldMin;
  if (record.expectedYieldMax && record.expectedYieldMax.error) return record.expectedYieldMax;
  if (record.expectedYieldAverage && record.expectedYieldAverage.error) return record.expectedYieldAverage;
  if (record.totalPlotExpectedMin && record.totalPlotExpectedMin.error) return record.totalPlotExpectedMin;
  if (record.totalPlotExpectedMax && record.totalPlotExpectedMax.error) return record.totalPlotExpectedMax;

  // Drop empty string fields so schema defaults apply
  Object.keys(record).forEach((k) => {
    if (record[k] === undefined) delete record[k];
  });

  return { record };
};

export const getHistoryRecords = async (req, res, next) => {
  try {
    const { plotId = null } = req.query;

    let records = [];
    if (dbReady()) {
      try {
        const filter = { userId: req.user._id ?? req.user.id };
        if (plotId) {
          filter.$or = [
            { plot: new RegExp(plotId, 'i') },
            { plotDetails: new RegExp(plotId, 'i') }
          ];
        }
        records = await HistoryRecord.find(filter).sort({ createdAt: -1 }).lean();
      } catch (err) {
        console.warn('[historyController] DB read failed, serving demo records:', err.message);
      }
    }

    if (!records || records.length === 0) {
      // Demo fallback (flagged isDemo: true) — the user has no stored records
      let demo = demoRecords();
      if (plotId) {
        demo = demo.filter(
          (r) =>
            r.plot.toLowerCase().includes(plotId.toLowerCase()) ||
            r.plotDetails.toLowerCase().includes(plotId.toLowerCase())
        );
      }
      return successResponse(res, demo, 'Demo history records (no stored records for this user)');
    }

    return successResponse(res, records.map(toClientRecord), 'Historical records retrieved');
  } catch (error) {
    next(error);
  }
};

export const getHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (dbReady() && isValidObjectId(id)) {
      try {
        const record = await HistoryRecord.findById(id).lean();
        if (record) {
          if (!ownsRecord(record, req.user)) {
            return errorResponse(res, 'You do not have access to this record', null, 403);
          }
          return successResponse(res, toClientRecord(record), 'History record retrieved');
        }
      } catch (err) {
        console.warn('[historyController] DB read failed:', err.message);
      }
      return errorResponse(res, 'History record not found', null, 404);
    }

    // Demo record ids (hist-1 …) only resolve to the demo dataset
    const demo = demoRecords().find((r) => r.id === id);
    if (demo) {
      return successResponse(res, demo, 'Demo history record retrieved');
    }
    return errorResponse(res, 'History record not found', null, 404);
  } catch (error) {
    next(error);
  }
};

export const createHistoryRecord = async (req, res, next) => {
  try {
    const { record, error } = validateHistoryBody(req.body);
    if (error) {
      return errorResponse(res, error, null, 400);
    }

    if (!dbReady()) {
      return errorResponse(
        res,
        'Database unavailable — history record cannot be saved. Please retry when MongoDB is reachable.',
        null,
        503
      );
    }

    const created = await HistoryRecord.create({
      ...record,
      userId: req.user._id ?? req.user.id,
      isDemo: req.body.isDemo === true
    });

    return successResponse(
      res,
      { ...created.toObject(), id: created._id.toString() },
      'History record created',
      201
    );
  } catch (error) {
    next(error);
  }
};
