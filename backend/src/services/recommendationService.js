import mongoose from 'mongoose';
import { Recommendation } from '../models/Recommendation.js';
import { Prediction } from '../models/Prediction.js';
import { HistoryRecord } from '../models/HistoryRecord.js';
import { weatherService } from './weatherService.js';
import { evaluateRules } from '../config/recommendationRules.js';

const dbReady = () => mongoose.connection.readyState === 1;

/**
 * Demo recommendation seed — used ONLY as an `isDemo: true` fallback when the
 * rule engine cannot produce anything (contract §3).
 */
export const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    category: 'WATER',
    title: 'Irrigation Management',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'Maintain adequate soil moisture. Provide light irrigation during flowering.',
    fullExplanation: 'During panicle elongation and full bloom, avoid heavy flood irrigation as it triggers vegetative flush instead of floral retention. Give light drip irrigation at 3-4 day intervals to sustain floral turgor.',
    actionRequired: 'Run drip lines for 90 minutes every 3rd day in morning hours (06:00 AM - 08:00 AM).',
    timing: 'Immediate — Next 48 Hours',
    icon: 'Droplet',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Mulch tree basin with dried grass/paddy straw (8-10 cm thickness) to conserve rhizosphere moisture.'
  },
  {
    id: 'rec-2',
    category: 'PEST',
    title: 'Pest Control (Mango Hopper & Thrips)',
    priority: 'MEDIUM',
    priorityColor: 'amber',
    shortText: 'Monitor for hoppers and thrips. Use recommended biological or chemical control.',
    fullExplanation: 'Early nymphs suck sap from tender panicles, turning them brown and dry (causing severe flower drop). Sample 5 panicles per tree in inner shaded canopy for hopper count.',
    actionRequired: 'If hopper count > 3/panicle, spray Azadirachtin (Neem oil 10,000 ppm) @ 2 ml/L or Thiamethoxam 25 WG @ 0.3 g/L.',
    timing: 'Inspect within 2 days; Spray in late evening',
    icon: 'Bug',
    badge: 'MEDIUM PRIORITY',
    organicAlternative: 'Neem seed kernel extract (NSKE 5%) spray with soap sticker.'
  },
  {
    id: 'rec-3',
    category: 'POLLINATION',
    title: 'Pollination & Honeybee Protection',
    priority: 'MEDIUM',
    priorityColor: 'amber',
    shortText: 'Encourage pollinators. Avoid excessive pesticide sprays during flowering.',
    fullExplanation: 'Over 85% of mango fruit set depends on insect vectors (Diptera & Apis honeybees). Heavy broad-spectrum spraying during peak bloom drastically cuts fruit set.',
    actionRequired: 'Refrain from spraying during peak bee foraging hours (08:30 AM to 12:30 PM). Place 2-3 bee boxes per acre if available.',
    timing: 'Throughout active bloom window (Next 12 days)',
    icon: 'Sparkles',
    badge: 'MEDIUM PRIORITY',
    organicAlternative: 'Spray 1% jaggery water on perimeter trees to attract beneficial dipteran flies and pollinators.'
  },
  {
    id: 'rec-4',
    category: 'NUTRITION',
    title: 'Foliar Nutrient & Micronutrient Spray',
    priority: 'LOW',
    priorityColor: 'emerald',
    shortText: 'Apply balanced nutrients to support flower retention and fruit set.',
    fullExplanation: 'Boron and Zinc are critical co-factors for pollen tube germination and ovule fertilization. Deficiency causes blackened tips and flower shedding.',
    actionRequired: 'Foliar spray of Solubor (Boron 20%) @ 1.25 g/L + Cheated Zinc @ 1.0 g/L at 50% panicle emergence.',
    timing: 'Within 5–7 days before flower opening',
    icon: 'PackagePlus',
    badge: 'LOW PRIORITY',
    organicAlternative: 'Enriched cow dung slurry (Jeevamrutha) foliar filter spray @ 5%.'
  },
  {
    id: 'rec-5',
    category: 'DISEASE',
    title: 'Powdery Mildew Prophylaxis',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'White powdery coating on flowers caused by Oidium mangiferae. Spray sulfur or hexaconazole.',
    fullExplanation: 'High relative humidity combined with cloudy days creates high epidemic risk for powdery mildew, turning panicles black and dropping flowers.',
    actionRequired: 'Apply Wettable Sulphur 80 WP @ 2.5 g/L or Hexaconazole 5% EC @ 1 ml/L before rain forecast.',
    timing: 'Apply before upcoming rain forecast window',
    icon: 'ShieldAlert',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Spray Trichoderma harzianum or Bacillus subtilis bio-fungicide @ 5 g/L.'
  }
];

const riskToScore = (risk) => {
  if (risk === 'High') return 2;
  if (risk === 'Moderate') return 1;
  return 0;
};

/**
 * Build the metrics object the rules are evaluated against:
 * latest prediction (bud health / flower drop risk / poor-yield pressure)
 * + current weather and 15-day forecast.
 */
const gatherMetrics = async ({ farmId, plotId, userId, predictionId = null }) => {
  // Defaults = demo baseline (flagged as demo through `inputsDemo`).
  const metrics = {
    budHealth: 78,
    flowerDropRisk: 'Moderate',
    flowerDropRiskScore: 1,
    poorYieldDetected: false,
    pestPressureScore: 1,
    temperature: null,
    humidity: null,
    windSpeed: null,
    maxRainProb: 0,
    maxRainMm: 0
  };
  let inputsDemo = true;

  // --- Weather (live when WEATHER_PROVIDER=openmeteo, otherwise demo) ---
  try {
    const [current, forecast] = await Promise.all([
      weatherService.getCurrentWeather(farmId),
      weatherService.get15DayForecast(farmId)
    ]);
    metrics.temperature = current.temperature ?? null;
    metrics.humidity = current.humidity ?? null;
    metrics.windSpeed = current.windSpeed ?? null;
    metrics.maxRainProb = Math.max(...(forecast || []).map((d) => d.rainProb || 0), 0);
    metrics.maxRainMm = Math.max(...(forecast || []).map((d) => d.rain || 0), 0);
    if (current.isDemo === false) inputsDemo = false;
  } catch (err) {
    console.warn('[recommendationService] Weather unavailable, using baseline metrics:', err.message);
  }

  // --- Latest prediction for this user/plot ---
  let prediction = null;
  if (dbReady()) {
    try {
      if (predictionId) {
        prediction = await Prediction.findById(predictionId).lean();
      } else {
        prediction = await Prediction.findOne({
          ...(userId ? { userId } : {}),
          ...(farmId ? { farmId } : {}),
          ...(plotId ? { plotId } : {})
        })
          .sort({ createdAt: -1 })
          .lean();
      }
    } catch (err) {
      console.warn('[recommendationService] Prediction lookup failed:', err.message);
    }
  }

  if (prediction) {
    metrics.budHealth = prediction.factors?.budHealth?.percentage ?? metrics.budHealth;
    metrics.flowerDropRisk =
      prediction.factors?.flowerDropRisk?.value ?? prediction.flowerDropRisk ?? metrics.flowerDropRisk;
    metrics.flowerDropRiskScore = riskToScore(metrics.flowerDropRisk);
    if (prediction.isDemo !== true) inputsDemo = false;
  }

  // --- Latest history record — poor-yield pressure feeds the pest rule ---
  if (dbReady()) {
    try {
      const latest = await HistoryRecord.findOne(userId ? { userId } : {})
        .sort({ createdAt: -1 })
        .lean();
      if (latest && latest.classification === 'Poor Yield Potential') {
        metrics.poorYieldDetected = true;
      }
      if (latest && latest.isDemo !== true) inputsDemo = false;
    } catch (err) {
      console.warn('[recommendationService] History lookup failed:', err.message);
    }
  }

  metrics.pestPressureScore = metrics.flowerDropRiskScore + (metrics.poorYieldDetected ? 1 : 0);

  return { metrics, inputsDemo };
};

const ruleToRecommendation = (rule, isDemo) => ({
  id: rule.id,
  category: rule.category,
  title: rule.title,
  priority: rule.priority,
  priorityColor: rule.priorityColor,
  shortText: rule.shortText,
  fullExplanation: rule.fullExplanation,
  actionRequired: rule.actionRequired,
  timing: rule.timing,
  icon: rule.icon,
  badge: rule.badge,
  organicAlternative: rule.organicAlternative,
  isDemo
});

export const recommendationService = {
  /**
   * Evaluate threshold rules against the latest prediction + weather.
   * Falls back to the DB seed / static defaults ONLY when no rule matches —
   * and those fallbacks are always flagged `isDemo: true`.
   */
  getRecommendations: async ({ farmId = 'farm-1', plotId = 'plot-a', predictionId = null, userId = null } = {}) => {
    const { metrics, inputsDemo } = await gatherMetrics({ farmId, plotId, userId, predictionId });

    const matched = evaluateRules(metrics);
    if (matched.length > 0) {
      return matched.map((rule) => ruleToRecommendation(rule, inputsDemo));
    }

    // Fallback 1: seeded recommendations from the DB (demo seed data)
    if (dbReady()) {
      try {
        const records = await Recommendation.find({ farmId }).lean();
        if (records && records.length > 0) {
          return records.map((r) => ({ ...r, id: r._id.toString(), isDemo: true }));
        }
      } catch (err) {
        console.warn('[recommendationService] DB fetch failed, using defaults:', err.message);
      }
    }

    // Fallback 2: static defaults — always demo
    return DEFAULT_RECOMMENDATIONS.map((r) => ({ ...r, isDemo: true }));
  }
};
