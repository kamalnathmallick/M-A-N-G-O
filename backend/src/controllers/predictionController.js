import mongoose from 'mongoose';
import { Image } from '../models/Image.js';
import { Prediction } from '../models/Prediction.js';
import { Farm } from '../models/Farm.js';
import { HistoryRecord } from '../models/HistoryRecord.js';
import { mlClientService } from '../services/mlClientService.js';
import { weatherService } from '../services/weatherService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const dbReady = () => mongoose.connection.readyState === 1;
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const riskBadgeColor = (risk) => (risk === 'Low' ? 'emerald' : risk === 'High' ? 'rose' : 'amber');
const riskToPercentage = (risk) => (risk === 'Low' ? 15 : risk === 'High' ? 65 : 35);

/**
 * Live climate -> payload fields for the ML yield rule. Demo/unavailable
 * weather is withheld entirely (the ML service then uses its own defaults,
 * disclosed via climateSource) so demo numbers are never passed off as real.
 */
const liveClimateFields = (climate) =>
  climate && climate.isLive
    ? {
        temperature: climate.temperature,
        humidity: climate.humidity,
        ...(climate.rainfall != null ? { rainfall: climate.rainfall } : {}),
        ...(climate.windSpeed != null ? { windSpeed: climate.windSpeed } : {})
      }
    : {};

/**
 * Real weather -> human-readable climate string; anything demo/unavailable is
 * marked as unknown instead of fabricating a favourable reading (item 7).
 */
const describeClimate = async (farmId) => {
  try {
    const weather = await weatherService.getCurrentWeather(farmId);
    if (weather && weather.isDemo === false && weather.temperature !== undefined && weather.humidity !== undefined) {
      const rainfall = Number(weather.rainfall);
      const windSpeed = Number(weather.windSpeed);
      return {
        climateCondition: `${weather.condition} (${weather.temperature}°C, ${weather.humidity}% RH)`,
        climate: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          ...(Number.isFinite(rainfall) ? { rainfall } : {}),
          ...(Number.isFinite(windSpeed) ? { windSpeed } : {}),
          isLive: true
        }
      };
    }
  } catch (err) {
    console.warn('[predictionController] Weather lookup failed:', err.message);
  }
  return {
    climateCondition: 'Unknown (live weather unavailable; demo weather withheld)',
    climate: { temperature: null, humidity: null, isLive: false }
  };
};

export const analyzeBudBatch = async (req, res, next) => {
  try {
    const files = req.files || [];
    const {
      farmId = 'farm-1',
      plotId = 'plot-a',
      variety = 'Alphonso (Hapus)',
      floweringStage = 'Panicle Elongation & Bloom',
      canopyDirection = 'General',
      season = '',
      analysisDate = '',
      plotArea = '',
      sampleMeta = ''
    } = req.body;

    // Per-sample canopy directions, e.g. { "north.jpg": "North", "south.jpg": "South" }.
    // Lets each stored image keep the canopy direction it was captured from.
    let perSampleDirection = {};
    if (typeof sampleMeta === 'string' && sampleMeta.trim().startsWith('{')) {
      try {
        perSampleDirection = JSON.parse(sampleMeta);
      } catch {
        perSampleDirection = {};
      }
    }

    // Plot area: use what the client sent, never invent a figure.
    const parsedPlotAcres = parseFloat(String(plotArea).replace(/[^0-9.]/g, ''));
    const plotAcres = Number.isFinite(parsedPlotAcres) && parsedPlotAcres > 0 ? parsedPlotAcres : null;

    // No fabricated sample payloads — at least one real image is required (§3).
    if (files.length === 0) {
      return errorResponse(res, 'At least one image is required.', null, 400);
    }

    // Build image payloads
    const imagePayloads = files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    // Call ML Client Service (Python FastAPI, or flagged demo fallback)
    const mlResult = await mlClientService.analyzeBudImages(imagePayloads, {
      farmId,
      plotId,
      variety,
      floweringStage,
      canopyDirection,
      season
    });

    // Nothing was classified (every sample failed the quality gate): mirror the
    // frontend's "No results were saved" contract. Persisting here would write
    // a fabricated 0% health run + yield range into Prediction/History/Plot.
    const anyClassified = (mlResult.images || []).length;
    if (anyClassified === 0 && mlResult.fromMLService === true) {
      const reason =
        (Array.isArray(mlResult.errors) && mlResult.errors[0]?.message) ||
        'None of the uploaded images passed quality checks.';
      return errorResponse(
        res,
        `${reason} Nothing was saved — no samples could be classified.`,
        mlResult.errors || [],
        422
      );
    }

    // Yield estimate requires a REAL bud-health score back from the CNN.
    // No measured health -> no invented 78% and no invented yield range.
    const measuredHealth =
      typeof mlResult.summary?.overallHealthScore === 'number' &&
      Number.isFinite(mlResult.summary.overallHealthScore)
        ? mlResult.summary.overallHealthScore
        : null;

    // Live climate is fetched BEFORE the yield call so real temperature/
    // humidity/rainfall/wind enter the fusion. With WEATHER_PROVIDER=mock the
    // values are demo, so they are withheld and climateSource discloses that
    // the ML service used its own defaults instead.
    const { climateCondition, climate } = await describeClimate(farmId);

    const liveClimatePayload = liveClimateFields(climate);

    const yieldEst = measuredHealth === null
      ? {
          expectedYieldMin: null,
          expectedYieldMax: null,
          expectedYieldAverage: null,
          yieldUnit: 'tonnes/acre',
          totalPlotExpectedMin: null,
          totalPlotExpectedMax: null,
          totalPlotUnit: 'tonnes',
          trained: false,
          method: 'unavailable_no_measured_bud_health',
          modelVersion: 'mangosense-yield-rule-v1',
          climateSource: 'not_used',
          isDemo: false,
          fromMLService: true
        }
      : {
          ...(await mlClientService.predictYield({
            budHealth: measuredHealth,
            variety,
            plotAcres: plotAcres ?? undefined,
            ...liveClimatePayload
          })),
          climateSource: climate.isLive ? 'live_weather' : 'service_defaults'
        };

    // Honest demo flags: derived from the ML result, never hardcoded.
    const budIsDemo = mlResult.isDemo === true || mlResult.is_demo === true || mlResult.fromMLService !== true;
    const yieldIsDemo = yieldEst.isDemo === true || yieldEst.fromMLService !== true;
    const isDemo = budIsDemo || yieldIsDemo;

    const summary = mlResult.summary || {};
    const overallHealth = measuredHealth;
    const healthText = overallHealth === null ? 'Not measured' : `${overallHealth}% healthy`;
    const dropRisk = summary.flowerDropRisk || 'Unknown';

    // Best-effort farm name for the history entry
    let farmName = null;
    if (dbReady() && isValidObjectId(farmId)) {
      try {
        const farm = await Farm.findById(farmId).lean();
        if (farm) farmName = farm.name;
      } catch (err) {
        // Non-fatal
      }
    }

    // Save image metadata to MongoDB (metadata only — no fabricated bud counts)
    const savedImageIds = [];
    if (dbReady()) {
      for (const img of (mlResult.images || [])) {
        try {
          const sourceFile = files.find((f) => f.filename === img.filename);
          const originalName = sourceFile?.originalname || img.title || img.filename || 'Bud Sample';
          const doc = await Image.create({
            userId: req.user?._id ?? req.user?.id,
            farmId,
            plotId,
            season,
            filename: img.filename || 'sample.jpg',
            originalName,
            url: img.url || `/uploads/${img.filename}`,
            filePath: sourceFile ? sourceFile.path : `uploads/${img.filename}`,
            mimeType: sourceFile ? sourceFile.mimetype : 'image/jpeg',
            size: sourceFile ? sourceFile.size : 0,
            // Per-sample canopy direction when the wizard supplied one.
            canopyDirection: perSampleDirection[originalName] || canopyDirection,
            stage: floweringStage,
            // Only what the model actually returned — never a default label.
            classification: img.classification ?? null,
            confidence: img.confidence ?? null,
            status: img.status ?? null,
            notes: img.notes || '',
            isDemo: budIsDemo
          });
          savedImageIds.push(doc._id.toString());
        } catch (e) {
          // Continue if DB write fails (e.g. goes offline mid-run)
        }
      }
    }

    // Create / Save Prediction Record
    let predictionRecord = null;
    if (dbReady()) {
      try {
        predictionRecord = await Prediction.create({
          userId: req.user?._id ?? req.user?.id,
          farmId,
          plotId,
          season,
          variety,
          floweringStage,
          canopyDirection,
          analysisDate: analysisDate || undefined,
          expectedYieldMin: yieldEst.expectedYieldMin,
          expectedYieldMax: yieldEst.expectedYieldMax,
          expectedYieldAverage: yieldEst.expectedYieldAverage,
          yieldUnit: yieldEst.yieldUnit,
          totalPlotExpectedMin: yieldEst.totalPlotExpectedMin,
          totalPlotExpectedMax: yieldEst.totalPlotExpectedMax,
          totalPlotUnit: yieldEst.totalPlotUnit,
          factors: {
            budHealth: {
              percentage: overallHealth,
              value: healthText,
              status: overallHealth === null ? 'unknown' : overallHealth >= 75 ? 'favorable' : 'warning'
            },
            flowerDropRisk: {
              value: dropRisk,
              percentage: riskToPercentage(dropRisk),
              status: dropRisk === 'Low' ? 'favorable' : 'warning'
            }
          },
          modelVersion: {
            budModel: mlResult.modelVersion || 'mangosense-cnn-v1',
            yieldModel: yieldEst.modelVersion || 'mangosense-yield-rule-v1'
          },
          climateSource: yieldEst.climateSource || 'service_defaults',
          isDemo
        });
      } catch (err) {
        console.warn('[predictionController] Prediction not persisted:', err.message);
      }
    }

    // Keep the plot's Dashboard summary in sync with THIS run so the Expected
    // Yield / Bud Health cards stop showing seed values (78 / 4.8-5.4) after a
    // real analysis. Demo farms use non-ObjectId ids and are skipped.
    if (dbReady() && isValidObjectId(farmId) && !isDemo) {
      try {
        const plotUpdate = { lastAnalysisDate: analysisDate || new Date().toISOString() };
        if (overallHealth !== null) plotUpdate.healthScore = overallHealth;
        if (
          Number.isFinite(yieldEst.expectedYieldMin) &&
          Number.isFinite(yieldEst.expectedYieldMax)
        ) {
          plotUpdate.expectedYield = `${yieldEst.expectedYieldMin} - ${yieldEst.expectedYieldMax}`;
        }
        if (dropRisk !== 'Unknown') plotUpdate.flowerDropRisk = dropRisk;
        await Farm.updateOne(
          { _id: farmId, 'plots.id': plotId },
          { $set: Object.fromEntries(Object.entries(plotUpdate).map(([k, v]) => [`plots.$.${k}`, v])) }
        );
      } catch (err) {
        console.warn('[predictionController] Plot summary not updated:', err.message);
      }
    }

    // Record in HistoryRecord (contract §3 fields)
    const goodYieldCount = summary.goodYieldCount ?? 0;
    const poorYieldCount = summary.poorYieldCount ?? 0;
    // Only call the batch healthy/poor when samples were actually classified.
    const classifiedCount = goodYieldCount + poorYieldCount;
    const batchClassification =
      classifiedCount === 0
        ? 'Not classified'
        : poorYieldCount > goodYieldCount
        ? 'Poor Yield Potential'
        : 'Good Yield Potential';
    const now = new Date();

    if (dbReady()) {
      try {
        await HistoryRecord.create({
          userId: req.user?._id ?? req.user?.id,
          farmId,
          farmName: farmName || undefined,
          plot: plotId.toUpperCase(),
          plotDetails: `${plotId.toUpperCase()}${plotAcres ? ` — ${plotAcres} acres` : ''} (${variety})`,
          season,
          date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          budHealth: overallHealth,
          healthyBudsText: overallHealth === null ? '—' : `${overallHealth}%`,
          flowerDropRisk: dropRisk,
          riskBadgeColor: riskBadgeColor(dropRisk),
          climateCondition,
          climate,
          imageIds: savedImageIds,
          classification: batchClassification,
          confidence: summary.confidenceScore ?? null,
          goodYieldCount,
          poorYieldCount,
          rejectedCount: summary.rejectedCount ?? 0,
          expectedYieldMin: yieldEst.expectedYieldMin,
          expectedYieldMax: yieldEst.expectedYieldMax,
          expectedYieldAverage: yieldEst.expectedYieldAverage,
          totalPlotExpectedMin: yieldEst.totalPlotExpectedMin,
          totalPlotExpectedMax: yieldEst.totalPlotExpectedMax,
          yieldUnit: yieldEst.yieldUnit,
          predictedYield:
            yieldEst.expectedYieldMin === null || yieldEst.expectedYieldMax === null
              ? 'Not available'
              : `${yieldEst.expectedYieldMin} – ${yieldEst.expectedYieldMax} t/acre`,
          totalTonnes:
            yieldEst.totalPlotExpectedMin === null || yieldEst.totalPlotExpectedMax === null
              ? 'Not available'
              : `${yieldEst.totalPlotExpectedMin} – ${yieldEst.totalPlotExpectedMax} t`,
          yieldMethod: yieldEst.method || null,
          yieldTrained: yieldEst.trained === true,
          sampleCount: files.length,
          keyObservation:
            classifiedCount === 0
              ? `All ${files.length} uploaded sample(s) failed quality checks — nothing was classified.`
              : isDemo
              ? `Demo analysis: ${healthText} estimated bud signal across ${files.length} sample(s) — ML service was offline.`
              : `Batch analysis completed. ${healthText} bud signal across ${classifiedCount} classified sample(s).`,
          modelVersion: {
            budModel: mlResult.modelVersion || 'mangosense-cnn-v1',
            yieldModel: yieldEst.modelVersion || 'mangosense-yield-rule-v1'
          },
          isDemo
        });
      } catch (err) {
        console.warn('[predictionController] History record not persisted:', err.message);
      }
    }

    // Response = flattened ML body PLUS the transport/persistence extras (§3)
    return successResponse(
      res,
      {
        ...mlResult,
        isDemo,
        fromMLService: mlResult.fromMLService === true,
        predictionId: predictionRecord ? predictionRecord._id.toString() : 'pred-local',
        // Yield + climate provenance travel WITH the analysis response so the
        // wizard's result view never needs a second round-trip (spec §16).
        yieldEstimation: yieldEst,
        climate: {
          condition: climateCondition,
          isLive: climate.isLive === true
        },
        modelVersion: {
          budModel: mlResult.modelVersion || 'mangosense-cnn-v1',
          yieldModel: yieldEst.modelVersion || 'mangosense-yield-rule-v1'
        }
      },
      isDemo
        ? 'Demo data was used for this analysis (ML service unavailable) — not a live model result'
        : 'Flower bud analysis completed successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getLatestPrediction = async (req, res, next) => {
  try {
    const { plotId = 'plot-a' } = req.query;

    let prediction = null;
    if (dbReady()) {
      try {
        prediction = await Prediction.findOne({ plotId, userId: req.user._id ?? req.user.id })
          .sort({ createdAt: -1 })
          .lean();
      } catch (err) {
        console.warn('[predictionController] Latest prediction lookup failed:', err.message);
      }
    }

    if (prediction) {
      return successResponse(
        res,
        {
          ...prediction,
          id: prediction._id.toString(),
          predictionId: prediction._id.toString(),
          isDemo: prediction.isDemo === true
        },
        'Latest yield prediction retrieved'
      );
    }

    // No stored prediction for this user/plot -> flagged demo fallback (§3)
    const yieldEst = await mlClientService.predictYield({
      budHealth: 78,
      variety: 'Alphonso',
      plotAcres: 2.5
    });

    const demoPrediction = {
      isDemo: true,
      predictionId: 'pred-default',
      generatedAt: '24 Aug 2026, 09:30 AM',
      plotId,
      plotName: 'Plot A — 2.5 acres',
      variety: 'Alphonso (Hapus)',
      expectedYieldMin: yieldEst.expectedYieldMin,
      expectedYieldMax: yieldEst.expectedYieldMax,
      expectedYieldAverage: yieldEst.expectedYieldAverage,
      yieldUnit: 'tonnes / acre',
      totalPlotExpectedMin: yieldEst.totalPlotExpectedMin,
      totalPlotExpectedMax: yieldEst.totalPlotExpectedMax,
      totalPlotUnit: 'tonnes total',
      predictionLabel: 'Demo Prediction',
      confidenceNote: 'Demo estimation based on multi-sample bud classification and 15-day climate projection.',
      factors: {
        budHealth: {
          label: 'Bud Health',
          value: '78% healthy',
          percentage: 78,
          impact: '+18% vs poor bud baseline',
          status: 'favorable',
          badge: 'High Quality Panicles'
        },
        climate: {
          label: 'Climate Condition',
          value: 'Favorable',
          percentage: 82,
          impact: '+12% optimal anthesis window',
          status: 'favorable',
          badge: 'Optimal Temperature'
        },
        flowerDropRisk: {
          label: 'Flower Drop Risk',
          value: 'Moderate',
          percentage: 35,
          impact: '-9% potential yield loss if untreated',
          status: 'warning',
          badge: 'Monitor Rain & Wind'
        },
        pestRisk: {
          label: 'Pest Risk',
          value: 'Low – Moderate',
          percentage: 22,
          impact: '-4% localized hopper pressure',
          status: 'favorable',
          badge: 'Early Stage Detected'
        }
      },
      benchmark: {
        varietyHistoricalAverage: 4.6,
        farmLastYearYield: 4.5,
        regionalBenchmark: 4.2,
        differenceFromLastYear: '+13.3%'
      },
      yieldDistribution: [
        { scenario: 'Severe Drop Risk', yield: 3.8, probability: 10, fill: '#ef4444' },
        { scenario: 'Sub-optimal Weather', yield: 4.4, probability: 25, fill: '#f59e0b' },
        { scenario: 'Current Forecast Range', yield: 5.1, probability: 85, fill: '#15803d', isCurrent: true },
        { scenario: 'Optimized Management', yield: 5.8, probability: 45, fill: '#10b981' }
      ],
      stageMilestones: [
        { stage: 'Flower Bud Emergence', date: 'Early August', status: 'Completed', health: '82%' },
        { stage: 'Panicle Elongation (Current)', date: 'Late August', status: 'In Progress', health: '78%' },
        { stage: 'Full Anthesis & Pollination', date: 'Early September', status: 'Upcoming', health: 'Estimated 75%' },
        { stage: 'Fruitlet Set (Pea Stage)', date: 'Mid September', status: 'Upcoming', health: 'Pending' },
        { stage: 'Harvesting', date: 'Late October - November', status: 'Projected', health: 'Target: 5.1 t/acre' }
      ]
    };

    return successResponse(res, demoPrediction, 'Demo yield prediction (no stored prediction for this plot)');
  } catch (error) {
    next(error);
  }
};

export const simulateSensitivity = async (req, res, next) => {
  try {
    const {
      budHealth = 78,
      rainfallIntensity = 'Moderate',
      pestControlActive = true,
      variety = 'Alphonso',
      plotAcres = 2.5
    } = req.body;

    const budHealthNum = Number(budHealth);
    if (Number.isNaN(budHealthNum) || budHealthNum < 0 || budHealthNum > 100) {
      return errorResponse(res, 'budHealth must be a number between 0 and 100', null, 400);
    }
    const plotAcresNum = Number(plotAcres);
    if (Number.isNaN(plotAcresNum) || plotAcresNum <= 0 || plotAcresNum > 10000) {
      return errorResponse(res, 'plotAcres must be a positive number', null, 400);
    }

    const { climate } = await describeClimate(req.body.farmId || 'farm-1');
    const dynamicYield = {
      ...(await mlClientService.predictYield({
        budHealth: budHealthNum,
        rainfallIntensity,
        pestControlActive: Boolean(pestControlActive),
        variety,
        plotAcres: plotAcresNum,
        // Same live-climate handling as the real analysis run so the
        // simulator agrees with the stored prediction for identical inputs.
        ...liveClimateFields(climate)
      })),
      climateSource: climate.isLive ? 'live_weather' : 'service_defaults'
    };

    return successResponse(res, dynamicYield, 'Simulation calculated');
  } catch (error) {
    next(error);
  }
};
