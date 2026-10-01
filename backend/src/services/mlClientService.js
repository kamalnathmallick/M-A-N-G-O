import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { env } from '../config/env.js';

/**
 * ML client.
 *
 * IMPORTANT (CONTRACT.md §2): both `analyzeBudImages` and `predictYield` return
 * the ML service response body FLATTENED (spread at the top level), plus the
 * transport flags `fromMLService` / `isDemo` — NEVER `{ data: response.data }`.
 * Controllers read `mlResult.summary`, `mlResult.images`,
 * `yieldEst.expectedYieldMin` directly from the returned object.
 *
 * All fallback (ML-service-offline) output is flagged `isDemo: true` /
 * `is_demo: true` and conforms to the contract's binary label set:
 *   GOOD  -> 'Good Yield Potential' / status 'healthy'
 *   BAD   -> 'Poor Yield Potential' / status 'poor_yield'
 *   quality-failed -> status 'rejected' (goes into `errors`, not `images`)
 * No bud counts or bounding boxes are ever fabricated (contract §0).
 */

const buildBudFormData = (images, options) => {
  const formData = new FormData();
  images.forEach((img, idx) => {
    if (img.path && fs.existsSync(img.path)) {
      formData.append('images', fs.createReadStream(img.path), img.filename || `sample_${idx}.jpg`);
    }
  });
  formData.append('farmId', options.farmId || 'farm-1');
  formData.append('plotId', options.plotId || 'plot-a');
  formData.append('variety', options.variety || 'Alphonso (Hapus)');
  formData.append('floweringStage', options.floweringStage || 'Panicle Elongation & Bloom');
  formData.append('canopyDirection', options.canopyDirection || 'General');
  if (options.season) formData.append('season', options.season);
  return formData;
};

export const mlClientService = {
  // Check if Python ML Service is online
  checkHealth: async () => {
    try {
      const response = await axios.get(`${env.ML_SERVICE_URL}/health`, { timeout: 1500 });
      return { online: true, details: response.data };
    } catch (err) {
      return { online: false, error: err.message };
    }
  },

  // Send batch of bud images to ML service (returns the FLATTENED ML body)
  analyzeBudImages: async (images, options = {}) => {
    const health = await mlClientService.checkHealth();

    if (health.online) {
      try {
        const formData = buildBudFormData(images, options);

        const response = await axios.post(`${env.ML_SERVICE_URL}/predict/bud`, formData, {
          headers: formData.getHeaders(),
          timeout: 15000
        });

        const body = response.data || {};
        // Flatten: return the ML body itself + transport flags on top.
        return {
          ...body,
          fromMLService: true,
          // The ML body uses `is_demo` (§2); expose the alias controllers read.
          isDemo: body.is_demo === true
        };
      } catch (err) {
        console.warn(`[ML Service Error] ${err.message}. Falling back to demo heuristic model (isDemo: true).`);
      }
    }

    // Heuristic Fallback Pipeline (ML service offline) — always isDemo: true
    return mlClientService.heuristicBudAnalysis(images, options);
  },

  /**
   * Fallback analysis used when the Python FastAPI service is offline.
   * Emits the CONTRACT §2 bud shape with binary labels and NO fabricated
   * bud counts / bounding boxes (contract §0). Always isDemo: true.
   */
  heuristicBudAnalysis: (images, options = {}) => {
    const modelVersion = 'mangosense-cnn-heuristic-v1';

    // Deterministic pseudo-classification (cycles good, good, good, poor)
    // so demo output stays stable across runs but still shows both classes.
    const GOOD_TEMPLATES = [
      {
        confidence: 91.4,
        notes: 'Uniform floral branching observed across the sampled canopy.'
      },
      {
        confidence: 88.6,
        notes: 'Consistent pea-stage development on healthy rachis branches.'
      },
      {
        confidence: 90.1,
        notes: 'Even bloom distribution with no visible stress symptoms.'
      }
    ];
    const POOR_TEMPLATES = [
      {
        confidence: 84.2,
        notes: 'Uneven development detected; sample flagged as poor yield potential.'
      }
    ];

    const results = images.map((img, idx) => {
      const isPoor = idx % 4 === 3;
      const template = isPoor
        ? POOR_TEMPLATES[idx % POOR_TEMPLATES.length]
        : GOOD_TEMPLATES[idx % GOOD_TEMPLATES.length];
      const goodYield = +(template.confidence / 100).toFixed(3);
      const filename = img.filename || `sample_${idx + 1}.jpg`;
      const url = img.url || `/uploads/${filename}`;

      return {
        id: `img-${Date.now()}-${idx}`,
        filename,
        title: img.originalname || img.title || `Panicle Sample #${idx + 1}`,
        stage: options.floweringStage || 'Panicle Elongation & Bloom',
        url,
        fallbackUrl: url,
        classification: isPoor ? 'Poor Yield Potential' : 'Good Yield Potential',
        confidence: template.confidence,
        status: isPoor ? 'poor_yield' : 'healthy',
        risk: { goodYield, poorYield: +(1 - goodYield).toFixed(3) },
        notes: template.notes,
        quality: {
          is_valid: true,
          blur_score: +(140 + idx * 3.4).toFixed(1),
          brightness: +(112 + idx * 2.5).toFixed(1),
          width: 1600,
          height: 1200
        },
        model_version: modelVersion
      };
    });

    const goodYieldCount = results.filter((r) => r.status === 'healthy').length;
    const poorYieldCount = results.filter((r) => r.status === 'poor_yield').length;
    const rejectedCount = results.filter((r) => r.status === 'rejected').length;
    const total = results.length || 1;

    const meanGoodYield = results.reduce((acc, r) => acc + (r.risk?.goodYield ?? 0.5), 0) / total;
    const meanConfidence =
      Math.round(results.reduce((acc, r) => acc + (r.confidence ?? 0), 0) / total * 10) / 10;

    const goodPercentage = Math.round((goodYieldCount / total) * 100);
    const poorPercentage = Math.round((poorYieldCount / total) * 100);
    const overallHealthScore = Math.round(meanGoodYield * 100);

    return {
      success: true,
      is_demo: true,
      isDemo: true,
      fromMLService: false,
      modelVersion,
      summary: {
        totalImagesAnalyzed: results.length,
        overallHealthScore,
        goodYieldCount,
        poorYieldCount,
        rejectedCount,
        confidenceScore: meanConfidence,
        flowerDropRisk: overallHealthScore >= 80 ? 'Low' : overallHealthScore >= 70 ? 'Moderate' : 'High',
        distribution: {
          goodPercentage,
          poorPercentage,
          goodRatio: goodPercentage,
          poorRatio: poorPercentage
        }
      },
      images: results,
      // Quality-failed images belong here, never in `images` (§2).
      errors: []
    };
  },

  // Yield prediction with feature fusion (returns the FLATTENED ML body)
  predictYield: async (features) => {
    const health = await mlClientService.checkHealth();

    if (health.online) {
      try {
        const response = await axios.post(`${env.ML_SERVICE_URL}/predict/yield`, features, {
          timeout: 10000
        });
        const body = response.data || {};
        // Flatten: return the ML body itself + transport flag on top.
        return {
          ...body,
          fromMLService: true,
          isDemo: body.isDemo === true
        };
      } catch (err) {
        console.warn(`[ML Service Error] ${err.message}. Falling back to baseline yield calculation (isDemo: true).`);
      }
    }

    // Rule-based fallback yield formula (ML service offline) — always isDemo: true
    const {
      budHealth = 78,
      variety = 'Alphonso',
      rainfallIntensity = 'Moderate',
      pestControlActive = true,
      plotAcres = 2.5
    } = features;

    let base = 4.0;
    if (variety.includes('Kesar')) base = 4.5;
    if (variety.includes('Banganapalli')) base = 4.8;
    if (variety.includes('Dasheri')) base = 3.9;

    const healthBonus = ((budHealth - 50) / 100) * 2.2;
    let rainPenalty = 0;
    if (rainfallIntensity === 'High') rainPenalty = 0.6;
    if (rainfallIntensity === 'Severe') rainPenalty = 1.1;

    const pestBonus = pestControlActive ? 0.3 : -0.4;
    const calcAverage = Math.max(2.5, +(base + healthBonus - rainPenalty + pestBonus).toFixed(2));
    const minVal = +(calcAverage - 0.3).toFixed(1);
    const maxVal = +(calcAverage + 0.3).toFixed(1);

    return {
      success: true,
      isDemo: true,
      fromMLService: false,
      // Disclose that no trained numeric-yield model exists yet (§2).
      trained: false,
      method: 'rule_based_pending_yield_dataset',
      modelVersion: 'mangosense-yield-rule-v1',
      expectedYieldMin: minVal,
      expectedYieldMax: maxVal,
      expectedYieldAverage: calcAverage,
      yieldUnit: 'tonnes / acre',
      totalPlotExpectedMin: +(minVal * plotAcres).toFixed(1),
      totalPlotExpectedMax: +(maxVal * plotAcres).toFixed(1),
      totalPlotUnit: 'tonnes total',
      dropRisk: rainPenalty > 0.4 ? 'High' : budHealth < 75 ? 'Moderate' : 'Low'
    };
  }
};
